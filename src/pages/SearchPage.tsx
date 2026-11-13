import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, LayoutGrid, List, BarChart2, FileDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";

type ViewMode = "table" | "card" | "chart";

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  // Filter States
  const [energyRange, setEnergyRange] = useState([0, 5000]);
  const [costRange, setCostRange] = useState([0, 25000]);
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [selectedCriticality, setSelectedCriticality] = useState<string[]>([]);

  const ALL_ZONES = ["ICU", "Operation", "Emergency", "Ward A", "Ward B", "OPD", "Admin Block", "Cafeteria"];
  const CRITICALITY_LEVELS = ["Critical", "Semi-Critical", "Non-Critical"];

  const [savedPresets, setSavedPresets] = useState<{name: string, zones: string[], crit: string[], eRange: number[], cRange: number[]}[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("clinergy_filter_presets");
      if (stored) setSavedPresets(JSON.parse(stored));
    } catch {}
  }, []);

  const savePreset = () => {
    const name = window.prompt("Enter a name for this preset:");
    if (!name) return;
    const newPreset = { name, zones: selectedZones, crit: selectedCriticality, eRange: energyRange, cRange: costRange };
    const updated = [...savedPresets, newPreset];
    setSavedPresets(updated);
    localStorage.setItem("clinergy_filter_presets", JSON.stringify(updated));
  };

  const loadPreset = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const preset = savedPresets.find(p => p.name === e.target.value);
    if (preset) {
      setSelectedZones(preset.zones);
      setSelectedCriticality(preset.crit);
      setEnergyRange(preset.eRange);
      setCostRange(preset.cRange);
    }
  };

  const toggleZone = (z: string) => {
    setSelectedZones(prev => prev.includes(z) ? prev.filter(x => x !== z) : [...prev, z]);
  };

  const toggleCriticality = (c: string) => {
    setSelectedCriticality(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };

  const clearAll = () => {
    setEnergyRange([0, 5000]);
    setCostRange([0, 25000]);
    setSelectedZones([]);
    setSelectedCriticality([]);
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* ── ALERTS SIDEBAR (Filters) ───────────────────────────────── */}
      <div className="w-full md:w-80 shrink-0 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-blue-600" />
            Filters
          </h2>
          <Button variant="ghost" size="sm" onClick={clearAll} className="h-8 text-xs text-slate-500 hover:text-slate-900">
            Clear All
          </Button>
        </div>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold">Saved Presets</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-2">
            <select 
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={loadPreset}
              defaultValue=""
            >
              <option value="" disabled>Load a preset...</option>
              <option value="Critical Zones Only">Critical Zones Only</option>
              <option value="High Cost Days">High Cost Days</option>
              <option value="Peak Hour Analysis">Peak Hour Analysis</option>
              {savedPresets.map(p => (
                <option key={p.name} value={p.name}>{p.name} (Custom)</option>
              ))}
            </select>
            <Button variant="outline" size="sm" className="w-full" onClick={savePreset}>
              Save Current as Preset
            </Button>
          </CardContent>
        </Card>

        {/* Zones Filter */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold">Zones</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 flex flex-wrap gap-2">
            {ALL_ZONES.map(z => (
              <Badge 
                key={z} 
                variant={selectedZones.includes(z) ? "default" : "outline"}
                className={`cursor-pointer transition-colors ${selectedZones.includes(z) ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-slate-100 text-slate-600'}`}
                onClick={() => toggleZone(z)}
              >
                {z}
              </Badge>
            ))}
          </CardContent>
        </Card>

        {/* Criticality Filter */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold">Criticality</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 flex flex-col gap-3">
            {CRITICALITY_LEVELS.map(c => (
              <label key={c} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={selectedCriticality.includes(c)}
                  onChange={() => toggleCriticality(c)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                {c}
              </label>
            ))}
          </CardContent>
        </Card>

        {/* Ranges Filter */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold">Metrics Range</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between text-xs font-medium text-slate-500">
                <span>Energy: {energyRange[0]} kWh</span>
                <span>{energyRange[1]} kWh</span>
              </div>
              <Slider
                defaultValue={[0, 5000]}
                max={5000}
                step={100}
                value={energyRange}
                onValueChange={(val) => setEnergyRange(val as number[])}
                className="w-full"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-xs font-medium text-slate-500">
                <span>Cost: ₹{costRange[0]}</span>
                <span>₹{costRange[1]}</span>
              </div>
              <Slider
                defaultValue={[0, 25000]}
                max={25000}
                step={500}
                value={costRange}
                onValueChange={(val) => setCostRange(val as number[])}
                className="w-full"
              />
            </div>
            
            <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white">Apply Filters</Button>
          </CardContent>
        </Card>
      </div>

      {/* ── MAIN CONTENT (Results) ─────────────────────────────────── */}
      <div className="flex-1 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Search Results</h1>
            <p className="text-sm text-slate-500">
              {initialQuery ? `Showing results for "${initialQuery}"` : "Showing all filtered records"} (24 items found)
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
              <Button size="icon" variant={viewMode === "table" ? "secondary" : "ghost"} onClick={() => setViewMode("table")} className="h-8 w-8 hover:bg-white rounded-md">
                <List className="h-4 w-4 text-slate-600" />
              </Button>
              <Button size="icon" variant={viewMode === "card" ? "secondary" : "ghost"} onClick={() => setViewMode("card")} className="h-8 w-8 hover:bg-white rounded-md">
                <LayoutGrid className="h-4 w-4 text-slate-600" />
              </Button>
              <Button size="icon" variant={viewMode === "chart" ? "secondary" : "ghost"} onClick={() => setViewMode("chart")} className="h-8 w-8 hover:bg-white rounded-md">
                <BarChart2 className="h-4 w-4 text-slate-600" />
              </Button>
            </div>
            
            <select className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Sort by Relevance</option>
              <option>Date (Newest)</option>
              <option>Energy (High-Low)</option>
              <option>Cost (High-Low)</option>
              <option>Zone (A-Z)</option>
            </select>
            
            <Button variant="outline" size="sm" className="hidden lg:flex">
              <FileDown className="h-4 w-4 mr-2" /> Export
            </Button>
          </div>
        </div>

        {/* Results Render Box */}
        {viewMode === "table" && (
          <Card className="shadow-sm border-slate-200">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Date/Time</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Zone</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Criticality</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Energy (kWh)</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Cost (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-600">Today, 14:00</td>
                      <td className="px-4 py-3 font-medium text-slate-900">ICU</td>
                      <td className="px-4 py-3"><Badge variant="outline" className="text-red-600 bg-red-50 border-none">Critical</Badge></td>
                      <td className="px-4 py-3 text-slate-700">1,245</td>
                      <td className="px-4 py-3 text-slate-700">₹4,500</td>
                    </tr>
                    <tr className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-600">Today, 15:00</td>
                      <td className="px-4 py-3 font-medium text-slate-900">Operation</td>
                      <td className="px-4 py-3"><Badge variant="outline" className="text-red-600 bg-red-50 border-none">Critical</Badge></td>
                      <td className="px-4 py-3 text-slate-700">980</td>
                      <td className="px-4 py-3 text-slate-700">₹3,400</td>
                    </tr>
                    <tr className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-600">Today, 16:00</td>
                      <td className="px-4 py-3 font-medium text-slate-900">Ward A</td>
                      <td className="px-4 py-3"><Badge variant="outline" className="text-yellow-600 bg-yellow-50 border-none">Semi</Badge></td>
                      <td className="px-4 py-3 text-slate-700">650</td>
                      <td className="px-4 py-3 text-slate-700">₹2,100</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {viewMode === "card" && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {['ICU', 'Operation', 'Ward A'].map((z, i) => (
              <Card key={i} className="shadow-sm border-slate-200">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{z}</CardTitle>
                    <Badge className={i < 2 ? "bg-red-50 text-red-600" : "bg-yellow-50 text-yellow-600"}>
                      {i < 2 ? 'Critical' : 'Semi'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 pt-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">Energy</span>
                      <span className="font-semibold text-slate-900">{(1245 - i*200).toLocaleString()} kWh</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">Cost</span>
                      <span className="font-semibold text-slate-900">₹{(4500 - i*800).toLocaleString()}</span>
                    </div>
                    <Button variant="outline" className="w-full mt-2" size="sm">View Details</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {viewMode === "chart" && (
          <Card className="shadow-sm border-slate-200 border-dashed bg-slate-50 flex items-center justify-center p-12">
            <div className="text-center">
              <BarChart2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-slate-900">Visualization View</h3>
              <p className="text-slate-500 text-sm mt-1">Graphical representation of filtered data renders here.</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
