"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Play, Pause, RotateCcw, Battery, Hand, Star } from "lucide-react"
import { squad } from "@/components/game/data"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Point = { x: number; y: number }

const teammates: Point[] = [
  { x: 30, y: 30 },
  { x: 70, y: 28 },
  { x: 22, y: 62 },
  { x: 78, y: 64 },
  { x: 50, y: 80 },
]
const opponents: Point[] = [
  { x: 40, y: 18 },
  { x: 62, y: 45 },
  { x: 35, y: 48 },
  { x: 50, y: 12 },
]

const playerArchetypes = squad.slice(1, 6).map((p, i) => ({
  name: p.name,
  role: p.style,
  specialStyle: p.specialStyle,
  specialName: p.specialName,
  x: [30, 70, 22, 78, 50][i],
  y: [30, 28, 62, 64, 80][i],
  bias: i < 2 ? "attack" : i === 2 ? "pass" : "support",
}))
