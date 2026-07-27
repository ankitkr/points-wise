import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

// The earn-rule fieldset shared by the new-card and add-rule forms.
// Accelerators are entered as JSON (admin tool); the server action validates
// them against the Zod schema and echoes precise errors back.
export function RuleFields({ defaultEffectiveFrom }: { defaultEffectiveFrom?: string }) {
  return (
    <fieldset className="space-y-3 rounded-md border p-4">
      <legend className="px-1 text-sm font-medium">Earn rule</legend>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label htmlFor="effectiveFrom">Effective from</Label>
          <Input id="effectiveFrom" name="effectiveFrom" type="date" required defaultValue={defaultEffectiveFrom} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="basePoints">Base points</Label>
          <Input id="basePoints" name="basePoints" type="number" step="any" min="0" required placeholder="5" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="basePer">per ₹</Label>
          <Input id="basePer" name="basePer" type="number" step="any" min="1" required placeholder="150" />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="accelerators">Accelerators (JSON array, optional)</Label>
        <Textarea
          id="accelerators"
          name="accelerators"
          rows={4}
          placeholder='[{"category":"travel-portal","label":"SmartBuy","multiplier":10,"monthlyCapPoints":15000}]'
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="exclusions">Excluded categories (comma-separated slugs)</Label>
        <Input id="exclusions" name="exclusions" placeholder="fuel, rent, wallet" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="notes">Notes</Label>
        <Input id="notes" name="notes" placeholder="Source / caveats" />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="verified" className="h-4 w-4" />
        Verified against an authoritative source
      </label>
    </fieldset>
  )
}
