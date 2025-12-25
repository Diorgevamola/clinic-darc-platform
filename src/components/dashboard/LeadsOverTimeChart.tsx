"use client"

import { useState, useEffect, useRef } from "react"
import { getLeadsOverTimeData } from "@/app/(dashboard)/actions"

interface ChartData {
    date: string
    total: number
    concluido: number
    em_andamento: number
    desqualificado: number // We'll map this to 'desq' for shorter code if needed, but full name is fine
}

export function LeadsOverTimeChart({ startDate, endDate }: { startDate?: string, endDate?: string }) {
    const [data, setData] = useState<ChartData[]>([])
    const [hoveredPoint, setHoveredPoint] = useState<ChartData | null>(null)
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
    const svgRef = useRef<SVGSVGElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [width, setWidth] = useState(800)

    const height = 300
    const padding = { top: 20, right: 20, bottom: 40, left: 50 }

    useEffect(() => {
        if (!containerRef.current) return;
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.contentBoxSize) {
                    // width in pixels
                    setWidth(entry.contentBoxSize[0].inlineSize);
                } else {
                    setWidth(entry.contentRect.width);
                }
            }
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);


    useEffect(() => {
        async function loadData() {
            const res = await getLeadsOverTimeData(startDate, endDate);
            setData(res);
        }
        loadData();
    }, [startDate, endDate])

    const getX = (index: number) => {
        if (data.length < 2) return padding.left
        return padding.left + (index / (data.length - 1)) * (width - padding.left - padding.right)
    }

    const getY = (value: number) => {
        const maxValue = Math.max(1, ...data.map(d => d.total));
        // Add 10% buffering on top
        const effectiveMax = maxValue * 1.1;
        return height - padding.bottom - (value / effectiveMax) * (height - padding.top - padding.bottom)
    }

    const getPath = (key: keyof ChartData) => {
        if (data.length < 2) return ""
        return data
            .map((point, i) => {
                const x = getX(i)
                const y = getY(point[key] as number)
                return `${i === 0 ? "M" : "L"} ${x},${y}`
            })
            .join(" ")
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!svgRef.current) return
        const rect = svgRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        setMousePos({ x, y })

        // Find closest point by X only is simpler and usually better for time series
        let closest: ChartData | null = null
        let minDist = Number.POSITIVE_INFINITY

        data.forEach((point, i) => {
            const px = getX(i)
            const dist = Math.abs(px - x)
            if (dist < minDist && dist < 50) { // wider capture range
                minDist = dist
                closest = point
            }
        })
        setHoveredPoint(closest)
    }

    const maxValue = Math.max(1, ...data.map(d => d.total));
    const effectiveMax = maxValue * 1.1;

    return (
        <div
            style={{
                width: "100%",
                backgroundColor: "#09090b", // zinc-950
                borderRadius: "16px",
                padding: "32px",
                fontFamily: "system-ui, -apple-system, sans-mono",
                border: "1px solid #27272a", // zinc-800
            }}
        >
            <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; r: 4; }
          50% { opacity: 0.7; r: 6; }
        }
        @keyframes drawLine {
          from { stroke-dashoffset: 2000; }
          to { stroke-dashoffset: 0; }
        }
        .flowing-line {
          stroke-dasharray: 2000;
          animation: drawLine 2s ease-out forwards;
        }
        .data-dot {
          animation: pulse 2s ease-in-out infinite;
        }
      `}</style>

            <div style={{ maxWidth: "100%", margin: "0 auto" }}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "24px",
                        flexWrap: "wrap",
                        gap: "10px"
                    }}
                >
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">
                            Evolução de Leads
                        </h2>
                        <p className="text-sm text-zinc-400">Desempenho no período selecionado</p>
                    </div>

                    <div className="flex gap-4 flex-wrap">

                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span className="text-sm text-zinc-400">Concluído</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <span className="text-sm text-zinc-400">Em andamento</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <span className="text-sm text-zinc-400">Desqualificado</span>
                        </div>
                    </div>
                </div>

                <div
                    ref={containerRef}
                    style={{
                        backgroundColor: "#18181b", // zinc-900
                        borderRadius: "16px",
                        padding: "24px",
                        position: "relative",
                        border: "1px solid #27272a",
                        height: "350px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}
                >
                    {data.length === 0 ? (
                        <div className="text-zinc-500">Carregando dados...</div>
                    ) : (
                        <svg
                            ref={svgRef}
                            width={width}
                            height={height}
                            viewBox={`0 0 ${width} ${height}`}
                            // Removed preserveAspectRatio="none" to default to uniform scaling logic or exact pixels
                            onMouseMove={handleMouseMove}
                            onMouseLeave={() => setHoveredPoint(null)}
                            style={{ cursor: "crosshair", overflow: "visible" }}
                        >
                            {/* Grid lines */}
                            {[0, 0.25, 0.5, 0.75, 1].map((val) => {
                                const yVal = Math.round(effectiveMax * val);
                                return (
                                    <g key={val}>
                                        <line
                                            x1={padding.left}
                                            y1={getY(yVal)}
                                            x2={width - padding.right}
                                            y2={getY(yVal)}
                                            stroke="#27272a"
                                            strokeDasharray="4 4"
                                        />
                                        <text
                                            x={padding.left - 10}
                                            y={getY(yVal)}
                                            fill="#71717a" // zinc-500
                                            fontSize="12"
                                            textAnchor="end"
                                            dominantBaseline="middle"
                                        >
                                            {yVal}
                                        </text>
                                    </g>
                                )
                            })}

                            {/* X-axis labels (Dates) */}
                            {data.length > 0 && [0, 0.25, 0.5, 0.75, 1].map((val) => {
                                const index = Math.min(Math.floor(val * (data.length - 1)), data.length - 1);
                                const point = data[index];
                                return (
                                    <text
                                        key={index}
                                        x={getX(index)}
                                        y={height - padding.bottom + 20}
                                        fill="#71717a"
                                        fontSize="10"
                                        textAnchor="middle"
                                    >
                                        {formatDate(point.date)}
                                    </text>
                                );
                            })}

                            {/* Draw Lines */}

                            {/* Concluido - Green */}
                            <path
                                className="flowing-line"
                                d={getPath('concluido')}
                                fill="none"
                                stroke="#22c55e"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                filter="drop-shadow(0 0 8px rgba(34, 197, 94, 0.3))"
                            />
                            {/* Em andamento - Yellow */}
                            <path
                                className="flowing-line"
                                d={getPath('em_andamento')}
                                fill="none"
                                stroke="#eab308"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeDasharray="4 4" // Dashed for difference
                            />
                            {/* Desqualificado - Red */}
                            <path
                                className="flowing-line"
                                d={getPath('desqualificado')}
                                fill="none"
                                stroke="#ef4444"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />


                            {/* Hover Effects */}
                            {hoveredPoint && (
                                <>
                                    <line
                                        x1={getX(data.indexOf(hoveredPoint))}
                                        y1={padding.top}
                                        x2={getX(data.indexOf(hoveredPoint))}
                                        y2={height - padding.bottom}
                                        stroke="#71717a"
                                        strokeDasharray="4 4"
                                        opacity="0.5"
                                    />

                                    {/* Dots for current point */}

                                    <circle cx={getX(data.indexOf(hoveredPoint))} cy={getY(hoveredPoint.concluido)} r="4" fill="#22c55e" stroke="white" strokeWidth="2" />
                                    <circle cx={getX(data.indexOf(hoveredPoint))} cy={getY(hoveredPoint.em_andamento)} r="4" fill="#eab308" stroke="white" strokeWidth="2" />
                                    <circle cx={getX(data.indexOf(hoveredPoint))} cy={getY(hoveredPoint.desqualificado)} r="4" fill="#ef4444" stroke="white" strokeWidth="2" />
                                </>
                            )}
                        </svg>
                    )}

                    {/* Tooltip */}
                    {hoveredPoint && data.length > 0 && (
                        <div
                            style={{
                                position: "absolute",
                                left: `${(data.indexOf(hoveredPoint) / (data.length - 1)) * 100}%`,
                                top: "10px",
                                transform: "translateX(-50%)",
                                backgroundColor: "#09090b",
                                border: "1px solid #27272a",
                                borderRadius: "8px",
                                padding: "12px",
                                pointerEvents: "none",
                                zIndex: 10,
                                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                                minWidth: "180px"
                            }}
                        >
                            <div className="text-zinc-200 font-bold text-sm mb-2 text-center">
                                {formatDate(hoveredPoint.date)}
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                <span className="text-indigo-400">Total:</span>
                                <span className="text-right text-white font-mono">{hoveredPoint.total}</span>

                                <span className="text-green-400">Concluído:</span>
                                <span className="text-right text-white font-mono">{hoveredPoint.concluido}</span>

                                <span className="text-yellow-400">Em andamento:</span>
                                <span className="text-right text-white font-mono">{hoveredPoint.em_andamento}</span>

                                <span className="text-red-400">Desqualif.:</span>
                                <span className="text-right text-white font-mono">{hoveredPoint.desqualificado}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function formatDate(dateStr: string) {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}`;
}
