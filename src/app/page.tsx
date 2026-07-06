import { Desktop } from '@/components/shell/Desktop'
import { windowsForPath } from '@/programs/resolve'

export default function Home() {
  return <Desktop initialWindows={windowsForPath([])} />
}
