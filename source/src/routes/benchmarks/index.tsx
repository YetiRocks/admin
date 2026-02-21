import { createFileRoute } from '@tanstack/react-router'
import BenchmarksPanel from '../../components/benchmarks/BenchmarksPanel'

export const Route = createFileRoute('/benchmarks/')({
  component: BenchmarksPanel,
})
