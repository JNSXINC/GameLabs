export function formatPlaytime(hours: number): string {
    if (!hours || hours <= 0) {
        return "Nunca jogado";
    }

    const totalMinutes = Math.round(hours * 60);

    if (totalMinutes < 60) {
        return `${totalMinutes} min`;
    }

    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;

    if (m === 0) {
        return `${h}h`;
    }

    return `${h}h ${m}m`;
}