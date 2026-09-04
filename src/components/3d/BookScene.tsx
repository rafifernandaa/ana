/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useMemo, useState, useEffect } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Text, ContactShadows } from "@react-three/drei";

interface BookMeshProps {
  scrollProgress: number; // 0 to 1
  isMobile: boolean;
}

export const BookMesh: React.FC<BookMeshProps> = ({ scrollProgress, isMobile }) => {
  const groupRef = useRef<THREE.Group>(null);
  const leftCoverRef = useRef<THREE.Group>(null);
  const rightCoverRef = useRef<THREE.Group>(null);
  const flippingPageRef = useRef<THREE.Group>(null);

  // Materials
  const leatherMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#0f172a"), // Midnight slate leather
        roughness: 0.45,
        metalness: 0.12,
      }),
    []
  );

  const goldMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#d97706"), // Gold foil
        roughness: 0.28,
        metalness: 0.88,
      }),
    []
  );

  const pageMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#faf7f2"), // Antique parchment ivory
        roughness: 0.9,
        metalness: 0.02,
      }),
    []
  );

  const pageEdgeMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#e5ded3"),
        roughness: 0.95,
      }),
    []
  );

  // Computed quotes and inking based on scroll stages
  const quoteData = useMemo(() => {
    if (scrollProgress < 0.2) {
      return {
        act: "ACT I · AWAKENING",
        left: "Between stimulus\nand response\nthere is a space.",
        right: "In that space is our\npower to choose\nour response.\n\n— Viktor E. Frankl",
        accent: "Neuroplastic journaling restores agency.",
      };
    } else if (scrollProgress < 0.45) {
      return {
        act: "ACT II · VENT-TO-CLARITY",
        left: "Separate camera facts\nfrom projected stories.\n\nWhat happened?\nWhat did the mind add?",
        right: "Circle of Control:\n→ In Control: My breath & next action\n→ Surrendered: Other opinions\n\n5-Min Micro-Action Anchor",
        accent: "Decentering quiets emotional spirals.",
      };
    } else if (scrollProgress < 0.72) {
      return {
        act: "ACT III · POLYVAGAL GLIMMERS",
        left: "The nervous system\ndoes not heal in threat.\n\nAnchor micro-moments\nof autonomic safety.",
        right: "Dual Physiological Sigh:\n4s Inhale · 1.5s Top-Up\n6s Extended Exhale\n\nVentral Vagal Brake Activated.",
        accent: "Heart Rate Variability grounded.",
      };
    } else if (scrollProgress < 0.9) {
      return {
        act: "ACT IV · CIRCADIAN CLOSURE",
        left: "Close open loops.\n\nEmpty working memory\nbefore the sun sets.",
        right: "Morning Dopamine Priming\nEvening Mental Offloading\n\nRestorative sleep unlocked.",
        accent: "No unclosed thoughts overnight.",
      };
    } else {
      return {
        act: "ACT V · SOVEREIGN VAULT",
        left: "Zero insecure defaults.\n\nOwner-bound Firestore\nencryption at rest.",
        right: "Your thoughts belong\nsolely to you.\n\nGemini 3.6 Flash Resilient Ladder.",
        accent: "Google Federated Auth · Safe Sanctuary",
      };
    }
  }, [scrollProgress]);

  // Frame kinematics interpolation
  useFrame((_, delta) => {
    if (!groupRef.current) return;

    let targetX = 0;
    let targetY = 0;
    let targetRotY = 0;
    let targetRotX = 0.36; // gentle tilt to inspect pages
    let targetCoverAngle = Math.PI * 0.94; // book open

    if (isMobile) {
      // Mobile choreography: Keep book centered horizontally, slight vertical motion
      if (scrollProgress < 0.15) {
        const t = scrollProgress / 0.15;
        targetX = 0;
        targetY = (1 - t) * -0.4;
        targetRotY = (1 - t) * 0.3;
        targetRotX = 0.25 + t * 0.12;
        targetCoverAngle = t * Math.PI * 0.94;
      } else {
        targetX = 0;
        targetY = 0.25;
        targetRotY = 0.05;
        targetRotX = 0.38;
        targetCoverAngle = Math.PI * 0.94;
      }
    } else {
      // Desktop choreography: Move between Left and Right to alternate with text cards
      if (scrollProgress < 0.15) {
        // Opening phase
        const t = scrollProgress / 0.15;
        targetX = 0;
        targetY = (1 - t) * -0.4;
        targetRotY = (1 - t) * 0.3;
        targetRotX = 0.25 + t * 0.12;
        targetCoverAngle = t * Math.PI * 0.94;
      } else if (scrollProgress < 0.42) {
        // Act 2: Book moves to Left (-2.2) so Card appears on Right
        const t = (scrollProgress - 0.15) / 0.27;
        targetX = THREE.MathUtils.lerp(0, -2.15, t);
        targetY = 0.05;
        targetRotY = THREE.MathUtils.lerp(0, 0.26, t);
        targetRotX = 0.38;
        targetCoverAngle = Math.PI * 0.94;
      } else if (scrollProgress < 0.68) {
        // Act 3: Book moves to Right (+2.15) so Card appears on Left
        const t = (scrollProgress - 0.42) / 0.26;
        targetX = THREE.MathUtils.lerp(-2.15, 2.15, t);
        targetY = -0.05;
        targetRotY = THREE.MathUtils.lerp(0.26, -0.26, t);
        targetRotX = 0.35;
        targetCoverAngle = Math.PI * 0.94;
      } else if (scrollProgress < 0.88) {
        // Act 4: Book moves back to Left (-2.1) so Card appears on Right
        const t = (scrollProgress - 0.68) / 0.2;
        targetX = THREE.MathUtils.lerp(2.15, -2.1, t);
        targetY = 0.05;
        targetRotY = THREE.MathUtils.lerp(-0.26, 0.24, t);
        targetRotX = 0.38;
        targetCoverAngle = Math.PI * 0.94;
      } else {
        // Act 5: Book centers for final CTA
        const t = (scrollProgress - 0.88) / 0.12;
        targetX = THREE.MathUtils.lerp(-2.1, 0, t);
        targetY = THREE.MathUtils.lerp(0.05, 0.15, t);
        targetRotY = THREE.MathUtils.lerp(0.24, 0, t);
        targetRotX = 0.42;
        targetCoverAngle = Math.PI * 0.94;
      }
    }

    // Smooth dampening
    groupRef.current.position.x = THREE.MathUtils.damp(groupRef.current.position.x, targetX, 5.5, delta);
    groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, targetY, 5.5, delta);
    groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, targetRotY, 5.5, delta);
    groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, targetRotX, 5.5, delta);

    if (leftCoverRef.current) {
      leftCoverRef.current.rotation.y = THREE.MathUtils.damp(
        leftCoverRef.current.rotation.y,
        -targetCoverAngle,
        6,
        delta
      );
    }
    if (rightCoverRef.current) {
      rightCoverRef.current.rotation.y = THREE.MathUtils.damp(
        rightCoverRef.current.rotation.y,
        0.04,
        6,
        delta
      );
    }

    // Page turning flutter as scroll transitions between acts
    if (flippingPageRef.current) {
      const cycle = (scrollProgress * 4) % 1;
      const flipAngle = cycle > 0.82 ? (cycle - 0.82) * 5.5 * Math.PI : 0;
      flippingPageRef.current.rotation.y = THREE.MathUtils.damp(
        flippingPageRef.current.rotation.y,
        -flipAngle,
        7,
        delta
      );
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]} scale={isMobile ? [0.72, 0.72, 0.72] : [1, 1, 1]}>
      {/* Central Spine */}
      <mesh position={[0, 0, 0]} material={leatherMaterial}>
        <boxGeometry args={[0.24, 3.4, 0.42]} />
      </mesh>
      {/* Gold Bands on Spine */}
      <mesh position={[0, 1.4, 0.22]} material={goldMaterial}>
        <boxGeometry args={[0.26, 0.08, 0.02]} />
      </mesh>
      <mesh position={[0, 0.7, 0.22]} material={goldMaterial}>
        <boxGeometry args={[0.26, 0.04, 0.02]} />
      </mesh>
      <mesh position={[0, -0.7, 0.22]} material={goldMaterial}>
        <boxGeometry args={[0.26, 0.04, 0.02]} />
      </mesh>
      <mesh position={[0, -1.4, 0.22]} material={goldMaterial}>
        <boxGeometry args={[0.26, 0.08, 0.02]} />
      </mesh>

      {/* Right Book Wing (Back Cover & Right Pages) */}
      <group ref={rightCoverRef} position={[0.12, 0, 0]}>
        {/* Leather Back Cover */}
        <mesh position={[1.15, 0, -0.19]} material={leatherMaterial}>
          <boxGeometry args={[2.3, 3.42, 0.08]} />
        </mesh>
        {/* Gold Border Trim on Cover */}
        <mesh position={[1.15, 0, -0.24]} material={goldMaterial}>
          <boxGeometry args={[2.1, 3.22, 0.01]} />
        </mesh>

        {/* Right Page Block */}
        <mesh position={[1.1, 0, -0.05]} material={pageMaterial}>
          <boxGeometry args={[2.16, 3.26, 0.24]} />
        </mesh>
        {/* Gold Leaf Edges */}
        <mesh position={[1.1, 0, -0.05]} material={pageEdgeMaterial}>
          <boxGeometry args={[2.17, 3.27, 0.23]} />
        </mesh>

        {/* Inked Typography on Right Page */}
        <group position={[1.1, 0.1, 0.08]}>
          <Text
            position={[-0.88, 1.25, 0]}
            fontSize={0.09}
            color="#4f46e5"
            anchorX="left"
            anchorY="top"
            maxWidth={1.75}
            lineHeight={1.4}
            font="serif"
          >
            {quoteData.act}
          </Text>
          <Text
            position={[-0.88, 0.95, 0]}
            fontSize={0.105}
            color="#1e293b"
            anchorX="left"
            anchorY="top"
            maxWidth={1.75}
            lineHeight={1.45}
            font="serif"
          >
            {quoteData.right}
          </Text>
          <Text
            position={[-0.88, -1.15, 0]}
            fontSize={0.075}
            color="#64748b"
            anchorX="left"
            anchorY="bottom"
            maxWidth={1.75}
            font="sans-serif"
          >
            {quoteData.accent}
          </Text>
        </group>
      </group>

      {/* Left Book Wing (Front Cover & Left Pages) */}
      <group ref={leftCoverRef} position={[-0.12, 0, 0]}>
        {/* Leather Front Cover */}
        <mesh position={[-1.15, 0, -0.19]} material={leatherMaterial}>
          <boxGeometry args={[2.3, 3.42, 0.08]} />
        </mesh>
        {/* Gold Border Trim on Cover */}
        <mesh position={[-1.15, 0, -0.24]} material={goldMaterial}>
          <boxGeometry args={[2.1, 3.22, 0.01]} />
        </mesh>

        {/* Left Page Block */}
        <mesh position={[-1.1, 0, -0.05]} material={pageMaterial}>
          <boxGeometry args={[2.16, 3.26, 0.24]} />
        </mesh>

        {/* Inked Typography on Left Page */}
        <group position={[-1.1, 0.1, 0.08]}>
          <Text
            position={[-0.88, 1.25, 0]}
            fontSize={0.12}
            color="#0f172a"
            anchorX="left"
            anchorY="top"
            maxWidth={1.75}
            lineHeight={1.42}
            font="serif"
          >
            {quoteData.left}
          </Text>
        </group>
      </group>

      {/* Flipping Page Sheet */}
      <group ref={flippingPageRef} position={[0, 0, 0.08]}>
        <mesh position={[1.06, 0, 0]} material={pageMaterial}>
          <boxGeometry args={[2.12, 3.24, 0.008]} />
        </mesh>
      </group>

      {/* Golden Silk Bookmark Ribbon */}
      <mesh position={[0.12, -1.9, 0.1]} rotation={[0, 0, 0.18]}>
        <boxGeometry args={[0.14, 1.3, 0.01]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.35} />
      </mesh>
    </group>
  );
};

export interface BookSceneProps {
  scrollProgress: number;
}

export const BookScene: React.FC<BookSceneProps> = ({ scrollProgress }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    // Check WebGL availability
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) {
        setHasWebGL(false);
      }
    } catch {
      setHasWebGL(false);
    }

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!hasWebGL) {
    // Graceful 2.5D CSS Fallback if WebGL is unavailable
    return (
      <div className="w-full h-full flex items-center justify-center p-6">
        <div className="w-80 h-96 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 p-6 text-amber-100 shadow-2xl border border-amber-500/30 flex flex-col justify-between">
          <span className="text-xs uppercase tracking-widest text-amber-400 font-mono">The Living Chronicle</span>
          <p className="font-serif italic text-lg leading-relaxed text-amber-50">
            "Between stimulus and response there is a space. In that space is our power to choose."
          </p>
          <span className="text-xs text-amber-300/80">Neuroplastic Cognitive Sanctuary</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 5.2], fov: isMobile ? 55 : 45 }}
        dpr={[1, 1.8]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={1.3} />
        <directionalLight position={[4, 7, 5]} intensity={1.9} castShadow />
        <directionalLight position={[-4, -2, 3]} intensity={0.7} color="#c7d2fe" />
        <pointLight position={[0, 2, 3]} intensity={0.8} color="#fef3c7" />

        <Float speed={1.8} rotationIntensity={0.12} floatIntensity={0.22}>
          <BookMesh scrollProgress={scrollProgress} isMobile={isMobile} />
        </Float>

        <ContactShadows
          position={[0, -2.1, 0]}
          opacity={0.42}
          scale={7.5}
          blur={2.5}
          far={4}
        />
      </Canvas>
    </div>
  );
};
