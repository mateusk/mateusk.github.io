import { useEffect } from "react"

export function useLoop(animation: () => Promise<void>) {
    useEffect(() => {
        let isActive = true

        async function runAnimation() {
            await animation()
            if (isActive) {
                runAnimation()
            }
        }

        runAnimation()
        return () => {
            isActive = false
        }
    }, [animation])
}
