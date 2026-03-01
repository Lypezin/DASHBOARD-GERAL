export interface GaugeConfig {
    value: number;
    min: number;
    max: number;
    target?: number;
    size: number;
    strokeWidth: number;
}

export function calculateGaugeData(config: GaugeConfig) {
    const { value, min, max, target, size, strokeWidth } = config;

    const clampedValue = Math.min(Math.max(value, min), max);
    const ratio = (clampedValue - min) / (max - min);
    const angle = ratio * 180; // semicircle

    // Color based on value
    let color = '#ef4444'; // red
    if (ratio >= 0.9) color = '#10b981'; // green
    else if (ratio >= 0.7) color = '#3b82f6'; // blue
    else if (ratio >= 0.5) color = '#f59e0b'; // amber

    // SVG arc calculations
    const cx = size / 2;
    const cy = size / 2 + 5;
    const r = (size - strokeWidth) / 2 - 5;

    // Background arc (full semicircle)
    const bgStart = { x: cx - r, y: cy };
    const bgEnd = { x: cx + r, y: cy };
    const bgPath = `M ${bgStart.x},${bgStart.y} A ${r},${r} 0 0,1 ${bgEnd.x},${bgEnd.y}`;

    // Value arc
    const endAngle = Math.PI - (angle * Math.PI) / 180;
    const valEnd = {
        x: cx + r * Math.cos(endAngle),
        y: cy - r * Math.sin(endAngle),
    };
    const largeArc = angle > 180 ? 1 : 0;
    const valuePath = `M ${bgStart.x},${bgStart.y} A ${r},${r} 0 ${largeArc},1 ${valEnd.x},${valEnd.y}`;

    // Target marker
    let targetMarker = null;
    if (target !== undefined) {
        const targetRatio = (target - min) / (max - min);
        const targetAngle = Math.PI - targetRatio * Math.PI;
        targetMarker = {
            x1: cx + (r - strokeWidth / 2 - 3) * Math.cos(targetAngle),
            y1: cy - (r - strokeWidth / 2 - 3) * Math.sin(targetAngle),
            x2: cx + (r + strokeWidth / 2 + 3) * Math.cos(targetAngle),
            y2: cy - (r + strokeWidth / 2 + 3) * Math.sin(targetAngle),
        };
    }

    return { bgPath, valuePath, color, cx, cy, r, targetMarker, ratio };
}
