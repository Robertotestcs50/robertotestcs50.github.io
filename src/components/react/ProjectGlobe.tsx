'use strict'
import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

interface ProjectData {
  slug: string
  title: string
  subtitle: string
  date: string
  location: { city: string; country: string; lat: number; lng: number } | null
  cover: string
}

interface Props {
  projects: ProjectData[]
  onSwitchToTimeline?: () => void
}

interface HoverState {
  index: number
  screenX: number
  screenY: number
}

// ─── Geographic helpers ───────────────────────────────────────────────────────

function deterministicSample(lat: number, lng: number): number {
  const x = Math.sin(lat * 127.1 + lng * 311.7) * 43758.5453
  return x - Math.floor(x)
}

function isOnLand(lat: number, lng: number): boolean {
  const φ = lat
  const λ = lng

  // North America
  if (φ > 25 && φ < 72 && λ > -168 && λ < -52) {
    if (φ > 51 && φ < 63 && λ > -95 && λ < -76) return false // Hudson Bay
    return true
  }
  if (φ > 7 && φ < 25 && λ > -118 && λ < -77) return true // Mexico + Central Am.
  if (φ > 59 && φ < 84 && λ > -58 && λ < -17) return true // Greenland
  if (φ > -56 && φ < 12 && λ > -82 && λ < -34) return true // South America

  // Europe
  if (φ > 36 && φ < 72 && λ > -11 && λ < 40) return true
  if (φ > 49 && φ < 62 && λ > -11 && λ < 2) return true // UK + Ireland

  // Africa
  if (φ > -36 && φ < 38 && λ > -18 && λ < 52) return true
  if (φ > -26 && φ < -12 && λ > 43 && λ < 51) return true // Madagascar

  // Middle East + Turkey
  if (φ > 15 && φ < 42 && λ > 26 && λ < 62) return true
  // South Asia
  if (φ > 5 && φ < 38 && λ > 60 && λ < 100) return true
  // East + SE Asia mainland
  if (φ > 10 && φ < 55 && λ > 100 && λ < 145) return true
  // Russia / Siberia
  if (φ > 50 && φ < 78 && λ > 28 && λ < 180) return true
  if (φ > 30 && φ < 50 && λ > 35 && λ < 100) return true // Central Asia

  // SE Asia islands (Indonesia / Philippines)
  if (φ > -10 && φ < 8 && λ > 95 && λ < 141)
    return deterministicSample(φ, λ) < 0.42
  if (φ > 5 && φ < 22 && λ > 116 && λ < 127)
    return deterministicSample(φ, λ) < 0.52
  if (φ > -10 && φ < 5 && λ > 110 && λ < 128)
    return deterministicSample(φ, λ) < 0.32
  // Japan
  if (φ > 30 && φ < 46 && λ > 129 && λ < 146)
    return deterministicSample(φ, λ) < 0.62

  // Australia + NZ
  if (φ > -45 && φ < -10 && λ > 113 && λ < 155) return true
  if (φ > -47 && φ < -34 && λ > 166 && λ < 179)
    return deterministicSample(φ, λ) < 0.65

  // Antarctica
  if (φ < -70) return true

  return false
}

function latLngTo3D(lat: number, lng: number, radius = 1): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  )
}

function xyzToLatLng(x: number, y: number, z: number): [number, number] {
  const lat = Math.asin(Math.max(-1, Math.min(1, y))) * (180 / Math.PI)
  const lng = Math.atan2(z, -x) * (180 / Math.PI) - 180
  return [lat, lng < -180 ? lng + 360 : lng]
}

// ─── Info card ────────────────────────────────────────────────────────────────

function InfoCard({
  project,
  screenX,
  screenY,
  canvasW,
  canvasH,
}: {
  project: ProjectData
  screenX: number
  screenY: number
  canvasW: number
  canvasH: number
}) {
  const cardW = 248
  const cardH = 112
  const offsetX = 20
  const offsetY = -cardH - 12

  let x = screenX + offsetX
  let y = screenY + offsetY

  if (x + cardW > canvasW - 8) x = screenX - cardW - offsetX
  if (y < 8) y = screenY + 16
  if (y + cardH > canvasH - 8) y = canvasH - cardH - 8

  const date = new Date(project.date)
  const label = date
    .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    .toUpperCase()

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: cardW,
        background: 'rgba(18, 18, 18, 0.94)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: '0.5rem',
        padding: '0.75rem 1rem',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          letterSpacing: '0.1em',
          color: '#FF5C00',
          marginBottom: '0.3rem',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '14px',
          fontWeight: 500,
          color: '#FAFAFA',
          marginBottom: '0.2rem',
          lineHeight: 1.3,
        }}
      >
        {project.title}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '12px',
          color: '#71717A',
          lineHeight: 1.4,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {project.subtitle}
      </div>
      {project.location && (
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.06em',
            color: 'rgba(255,255,255,0.28)',
            marginTop: '0.4rem',
            textTransform: 'uppercase',
          }}
        >
          {project.location.city}, {project.location.country}
        </div>
      )}
    </div>
  )
}

// ─── Globe component ──────────────────────────────────────────────────────────

export default function ProjectGlobe({ projects, onSwitchToTimeline }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoverState, setHoverState] = useState<HoverState | null>(null)
  const [webglOk, setWebglOk] = useState(true)
  const [canvasSize, setCanvasSize] = useState({ w: 1, h: 1 })

  // Three.js object refs — never trigger re-renders
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const clockRef = useRef(new THREE.Clock())
  const frameIdRef = useRef(0)
  const glowsRef = useRef<{ mesh: THREE.Mesh; idx: number }[]>([])
  const pinDotsRef = useRef<THREE.Mesh[]>([])
  const hitboxesRef = useRef<THREE.Mesh[]>([])
  const pinWorldRef = useRef<THREE.Vector3[]>([])
  const hoveredIdxRef = useRef<number | null>(null)
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reducedMotion = useRef(
    typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const isTouchRef = useRef(false)

  const projectsWithLocation = projects.filter((p) => p.location !== null)

  // ── Scene setup ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    // WebGL check
    const testCtx = canvas.getContext('webgl2') || canvas.getContext('webgl')
    if (!testCtx) {
      setWebglOk(false)
      return
    }

    const isMobile = window.innerWidth < 768
    const W = container.clientWidth
    const H = container.clientHeight
    setCanvasSize({ w: W, h: H })

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !isMobile,
      alpha: false,
    })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x0a0a0a, 1)
    rendererRef.current = renderer

    // Scene
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100)
    camera.position.z = 2.5
    cameraRef.current = camera

    // ── Wireframe sphere ──
    const sphereGeo = new THREE.SphereGeometry(1, 48, 48)
    const wireMat = new THREE.MeshBasicMaterial({
      wireframe: true,
      color: 0xffffff,
      transparent: true,
      opacity: 0.04,
    })
    scene.add(new THREE.Mesh(sphereGeo, wireMat))

    // ── Atmosphere ──
    const atmosGeo = new THREE.SphereGeometry(1.08, 48, 48)
    const atmosMat = new THREE.MeshBasicMaterial({
      color: 0x4a90e2,
      transparent: true,
      opacity: 0.06,
      side: THREE.BackSide,
    })
    scene.add(new THREE.Mesh(atmosGeo, atmosMat))

    // ── Land dots ──
    const dotCount = isMobile ? 500 : 2000
    const dotGeo = new THREE.SphereGeometry(0.007, 4, 4)
    const dotMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.18,
    })

    const landPoints: THREE.Vector3[] = []
    const goldenAngle = Math.PI * (3 - Math.sqrt(5))
    for (let i = 0; i < dotCount * 3 && landPoints.length < dotCount; i++) {
      const y = 1 - (i / (dotCount * 3 - 1)) * 2
      const r = Math.sqrt(Math.max(0, 1 - y * y))
      const theta = goldenAngle * i
      const x = Math.cos(theta) * r
      const z = Math.sin(theta) * r
      const [lat, lng] = xyzToLatLng(x, y, z)
      if (isOnLand(lat, lng)) landPoints.push(new THREE.Vector3(x, y, z))
    }

    if (landPoints.length > 0) {
      const dummy = new THREE.Object3D()
      const instanced = new THREE.InstancedMesh(dotGeo, dotMat, landPoints.length)
      landPoints.forEach((pos, i) => {
        dummy.position.copy(pos)
        dummy.updateMatrix()
        instanced.setMatrixAt(i, dummy.matrix)
      })
      instanced.instanceMatrix.needsUpdate = true
      scene.add(instanced)
    }

    // ── Project pins ──
    const glows: { mesh: THREE.Mesh; idx: number }[] = []
    const pinDots: THREE.Mesh[] = []
    const hitboxes: THREE.Mesh[] = []
    const pinWorldPositions: THREE.Vector3[] = []

    projectsWithLocation.forEach((project, idx) => {
      const loc = project.location!
      const outDir = latLngTo3D(loc.lat, loc.lng, 1).normalize()
      const stemCenter = outDir.clone().multiplyScalar(1.05)
      const tipPos = outDir.clone().multiplyScalar(1.09)

      const up = new THREE.Vector3(0, 1, 0)
      const quat = new THREE.Quaternion().setFromUnitVectors(up, outDir)

      // Stem
      const stemMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.003, 0.003, 0.06, 4),
        new THREE.MeshBasicMaterial({
          color: 0xff5c00,
          transparent: true,
          opacity: 0.65,
        }),
      )
      stemMesh.position.copy(stemCenter)
      stemMesh.quaternion.copy(quat)
      scene.add(stemMesh)

      // Dot
      const dotMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.012, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xff5c00 }),
      )
      dotMesh.position.copy(tipPos)
      scene.add(dotMesh)

      // Glow
      const glowMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.028, 8, 8),
        new THREE.MeshBasicMaterial({
          color: 0xff5c00,
          transparent: true,
          opacity: 0.28,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      )
      glowMesh.position.copy(tipPos)
      scene.add(glowMesh)
      glows.push({ mesh: glowMesh, idx })

      // Hitbox (invisible)
      const hitbox = new THREE.Mesh(
        new THREE.SphereGeometry(0.065, 6, 6),
        new THREE.MeshBasicMaterial({
          transparent: true,
          opacity: 0,
          depthWrite: false,
        }),
      )
      hitbox.position.copy(tipPos)
      hitbox.userData.projectIndex = idx
      scene.add(hitbox)

      pinDots.push(dotMesh)
      hitboxes.push(hitbox)
      pinWorldPositions.push(tipPos.clone())

      // Associate stem with pin index for visibility updates
      stemMesh.userData.projectIndex = idx
      dotMesh.userData.projectIndex = idx
    })

    glowsRef.current = glows
    pinDotsRef.current = pinDots
    hitboxesRef.current = hitboxes
    pinWorldRef.current = pinWorldPositions

    // ── OrbitControls ──
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableZoom = false
    controls.enablePan = false
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.autoRotate = !reducedMotion.current
    controls.autoRotateSpeed = 0.5
    controlsRef.current = controls

    // Pause auto-rotate on drag, resume after 3s
    const pauseRotate = () => {
      controls.autoRotate = false
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
    }
    const scheduleResume = () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
      if (!reducedMotion.current) {
        resumeTimerRef.current = setTimeout(() => {
          controls.autoRotate = true
        }, 3000)
      }
    }
    renderer.domElement.addEventListener('mousedown', pauseRotate)
    renderer.domElement.addEventListener('touchstart', pauseRotate, { passive: true })
    renderer.domElement.addEventListener('mouseup', scheduleResume)
    renderer.domElement.addEventListener('touchend', scheduleResume, { passive: true })

    // ── Render loop ──
    const raycaster = new THREE.Raycaster()
    const clock = clockRef.current

    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate)
      controls.update()

      const t = clock.getElapsedTime()
      const cam = cameraRef.current!
      const camDir = cam.position.clone().normalize()

      // Update pin pulse + visibility
      glowsRef.current.forEach(({ mesh, idx }) => {
        const pinNormal = mesh.position.clone().normalize()
        const visibility = pinNormal.dot(camDir)

        if (visibility < 0.15) {
          mesh.visible = false
          if (pinDotsRef.current[idx]) pinDotsRef.current[idx].visible = false
          return
        }

        mesh.visible = true
        if (pinDotsRef.current[idx]) pinDotsRef.current[idx].visible = true

        const baseOpacity = Math.max(0.08, (visibility - 0.15) / 0.85)
        const mat = mesh.material as THREE.MeshBasicMaterial
        mat.opacity = 0.28 * baseOpacity

        if (!reducedMotion.current) {
          const phase = t * Math.PI - idx * 0.3
          const pulse = 1.2 + 0.3 * Math.sin(phase)
          const isHovered = hoveredIdxRef.current === idx
          const target = isHovered ? pulse * 1.6 : pulse
          mesh.scale.setScalar(
            mesh.scale.x + (target - mesh.scale.x) * 0.12,
          )
          if (pinDotsRef.current[idx]) {
            const dotTarget = isHovered ? 1.4 : 1.0
            const dot = pinDotsRef.current[idx]
            dot.scale.setScalar(dot.scale.x + (dotTarget - dot.scale.x) * 0.12)
          }
        }
      })

      renderer.render(scene, camera)
    }
    animate()

    // ── Resize handler ──
    const handleResize = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
      setCanvasSize({ w, h })
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(frameIdRef.current)
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
      window.removeEventListener('resize', handleResize)
      renderer.domElement.removeEventListener('mousedown', pauseRotate)
      renderer.domElement.removeEventListener('touchstart', pauseRotate)
      renderer.domElement.removeEventListener('mouseup', scheduleResume)
      renderer.domElement.removeEventListener('touchend', scheduleResume)
      controls.dispose()
      renderer.dispose()
      // Dispose geometries + materials
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose()
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose())
          } else {
            obj.material.dispose()
          }
        }
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Raycasting on mousemove ──────────────────────────────────────────────────
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isTouchRef.current) return
      const camera = cameraRef.current
      const canvas = canvasRef.current
      if (!camera || !canvas) return

      const rect = canvas.getBoundingClientRect()
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      )

      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObjects(hitboxesRef.current)

      if (intersects.length > 0) {
        const idx = intersects[0].object.userData.projectIndex as number
        if (hoveredIdxRef.current !== idx) {
          hoveredIdxRef.current = idx
          // Project world position to screen
          const worldPos = pinWorldRef.current[idx]
          const projected = worldPos.clone().project(camera)
          const sx = (projected.x * 0.5 + 0.5) * canvasSize.w
          const sy = (-projected.y * 0.5 + 0.5) * canvasSize.h
          setHoverState({ index: idx, screenX: sx, screenY: sy })
          if (canvas.style) canvas.style.cursor = 'pointer'
        }
      } else if (hoveredIdxRef.current !== null) {
        hoveredIdxRef.current = null
        setHoverState(null)
        if (canvas.style) canvas.style.cursor = 'default'
      }
    },
    [canvasSize],
  )

  const handleMouseLeave = useCallback(() => {
    hoveredIdxRef.current = null
    setHoverState(null)
  }, [])

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const camera = cameraRef.current
      const canvas = canvasRef.current
      if (!camera || !canvas) return

      const rect = canvas.getBoundingClientRect()
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      )

      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObjects(hitboxesRef.current)

      if (intersects.length > 0) {
        const idx = intersects[0].object.userData.projectIndex as number
        const project = projectsWithLocation[idx]
        window.location.href = `/projects/${project.slug}`
      }
    },
    [projectsWithLocation],
  )

  // Touch: tap to show card, second tap to navigate
  const lastTapRef = useRef<number | null>(null)
  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      isTouchRef.current = true
      const camera = cameraRef.current
      const canvas = canvasRef.current
      if (!camera || !canvas || e.changedTouches.length === 0) return

      const touch = e.changedTouches[0]
      const rect = canvas.getBoundingClientRect()
      const mouse = new THREE.Vector2(
        ((touch.clientX - rect.left) / rect.width) * 2 - 1,
        -((touch.clientY - rect.top) / rect.height) * 2 + 1,
      )

      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObjects(hitboxesRef.current)

      if (intersects.length > 0) {
        const idx = intersects[0].object.userData.projectIndex as number
        const worldPos = pinWorldRef.current[idx]
        const projected = worldPos.clone().project(camera)
        const sx = (projected.x * 0.5 + 0.5) * canvasSize.w
        const sy = (-projected.y * 0.5 + 0.5) * canvasSize.h

        if (lastTapRef.current === idx) {
          // Second tap → navigate
          window.location.href = `/projects/${projectsWithLocation[idx].slug}`
        } else {
          lastTapRef.current = idx
          hoveredIdxRef.current = idx
          setHoverState({ index: idx, screenX: sx, screenY: sy })
        }
      } else {
        lastTapRef.current = null
        hoveredIdxRef.current = null
        setHoverState(null)
      }
    },
    [canvasSize, projectsWithLocation],
  )

  if (!webglOk) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          gap: '1rem',
          color: '#71717A',
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
          textAlign: 'center',
          padding: '2rem',
        }}
      >
        <span>Globe view requires WebGL.</span>
        {onSwitchToTimeline && (
          <button
            onClick={onSwitchToTimeline}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '9999px',
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'transparent',
              color: '#FAFAFA',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              letterSpacing: '0.08em',
            }}
          >
            SWITCH TO TIMELINE
          </button>
        )}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width: '100%', height: '100%' }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onTouchEnd={handleTouchEnd}
        aria-hidden="true"
      />

      {/* Info card */}
      {hoverState !== null && projectsWithLocation[hoverState.index] && (
        <InfoCard
          project={projectsWithLocation[hoverState.index]}
          screenX={hoverState.screenX}
          screenY={hoverState.screenY}
          canvasW={canvasSize.w}
          canvasH={canvasSize.h}
        />
      )}

      {/* Screen reader navigation */}
      <ul
        aria-label="Projects list"
        style={{
          position: 'absolute',
          opacity: 0,
          pointerEvents: 'none',
          width: 1,
          height: 1,
          overflow: 'hidden',
        }}
      >
        {projects.map((p) => (
          <li key={p.slug}>
            <a href={`/projects/${p.slug}`}>{p.title}</a>
          </li>
        ))}
      </ul>
    </div>
  )
}
