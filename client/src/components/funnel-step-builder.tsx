import { Plus, Trash2, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface FunnelStep {
  id: string
  name: string
  matchType: "path" | "hostname"
  matchValue: string
}

interface FunnelStepBuilderProps {
  steps: FunnelStep[]
  onChange: (steps: FunnelStep[]) => void
}

export function FunnelStepBuilder({ steps, onChange }: FunnelStepBuilderProps) {
  const addStep = () => {
    const newStep: FunnelStep = {
      id: crypto.randomUUID(),
      name: `Step ${steps.length + 1}`,
      matchType: "path",
      matchValue: "",
    }
    onChange([...steps, newStep])
  }

  const removeStep = (id: string) => {
    onChange(steps.filter((step) => step.id !== id))
  }

  const updateStep = (id: string, updates: Partial<FunnelStep>) => {
    onChange(
      steps.map((step) => (step.id === id ? { ...step, ...updates } : step))
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Funnel Steps</h3>
        <Button
          onClick={addStep}
          size="sm"
          variant="outline"
          className="h-8"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Step
        </Button>
      </div>

      {steps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">
            No steps configured
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Add your first funnel step to get started
          </p>
          <Button onClick={addStep} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            Add First Step
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className="border rounded-lg p-4 space-y-3 bg-card"
            >
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Step {index + 1}</span>
                <Button
                  onClick={() => removeStep(step.id)}
                  size="sm"
                  variant="ghost"
                  className="ml-auto h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`name-${step.id}`}>Step Name</Label>
                <Input
                  id={`name-${step.id}`}
                  value={step.name}
                  onChange={(e) =>
                    updateStep(step.id, { name: e.target.value.trim() })
                  }
                  placeholder="e.g., Landing Page"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor={`match-type-${step.id}`}>Match By</Label>
                  <Select
                    value={step.matchType}
                    onValueChange={(value: "path" | "hostname") =>
                      updateStep(step.id, { matchType: value })
                    }
                  >
                    <SelectTrigger id={`match-type-${step.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="path">Path</SelectItem>
                      <SelectItem value="hostname">Hostname</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`match-value-${step.id}`}>
                    {step.matchType === "path" ? "Path" : "Hostname"}
                  </Label>
                  <Input
                    id={`match-value-${step.id}`}
                    value={step.matchValue}
                    onChange={(e) =>
                      updateStep(step.id, { matchValue: e.target.value.trim() })
                    }
                    placeholder={
                      step.matchType === "path"
                        ? "/landing"
                        : "example.com"
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {steps.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Users must complete each step in order. Step {steps.length} requires
          completion of all previous steps.
        </p>
      )}
    </div>
  )
}
