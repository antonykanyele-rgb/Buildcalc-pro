import { useState } from 'react'

function App() {
  const [step, setStep] = useState(1)
  const [project, setProject] = useState({
    name: '',
    type: 'residential',
    length: '',
    width: '',
    height: '',
    floors: '1',
    slabThickness: '4',
    floorType: 'slab'
  })
  const [materials, setMaterials] = useState({
    concrete: true,
    bricks: false,
    lumber: false,
    roofing: false,
    drywall: false,
    flooring: false,
    windows: false,
    electrical: false,
    plumbing: false
  })
  const [laborRate, setLaborRate] = useState(10)
  const [contingencyRate, setContingencyRate] = useState(5)
  const [results, setResults] = useState(null)

  // US Average prices per unit (2024)
  const prices = {
    concrete: 150,      // per cubic yard
    bricks: 0.75,       // per brick
    lumber: 8,          // per board foot
    roofing: 5,         // per sq ft
    drywall: 15,        // per 4x8 sheet
    cement: 15,         // per 94lb bag
    flooring: 8,        // per sq ft (average)
    windows: 450,       // per window (average)
    electrical: 4,      // per sq ft
    plumbing: 6,        // per sq ft
    suspendedSlab: 12,  // per sq ft
    woodFrame: 6        // per sq ft
  }

  const buildingMultipliers = {
    residential: 1,
    commercial: 1.25,
    apartment: 1.15
  }

  const calculate = () => {
    const L = parseFloat(project.length) || 0
    const W = parseFloat(project.width) || 0
    const H = parseFloat(project.height) || 0
    const T = parseFloat(project.slabThickness) / 12 || 0
    const floors = parseInt(project.floors) || 1
    const multiplier = buildingMultipliers[project.type]

    const floorArea = L * W
    const totalFloorArea = floorArea * floors
    const wallAreaPerFloor = 2 * (L + W) * H
    const totalWallArea = wallAreaPerFloor * floors
    const perimeterLength = 2 * (L + W)
    const windowCount = Math.ceil(totalWallArea / 100) // 1 window per 100 sq ft wall

    let breakdown = []
    let materialTotal = 0

    // Foundation concrete (ground floor only)
    if (materials.concrete) {
      const cubicYards = (L * W * T) / 27
      const cementBags = Math.ceil(cubicYards * 1.25)
      const concreteCost = cubicYards * prices.concrete * multiplier
      const cementCost = cementBags * prices.cement
      breakdown.push({ 
        name: 'Foundation Concrete', 
        qty: cubicYards.toFixed(2), 
        unit: 'cu yd', 
        cost: concreteCost,
        note: 'Ground floor slab'
      })
      breakdown.push({ 
        name: 'Cement Bags', 
        qty: cementBags, 
        unit: 'bags', 
        cost: cementCost,
        note: 'For foundation'
      })
      materialTotal += concreteCost + cementCost
    }

    // Additional floor structures (for multi-story)
    if (floors > 1 && (project.floorType === 'suspended' || project.floorType === 'wood')) {
      const additionalFloors = floors - 1
      const floorCost = project.floorType === 'suspended' 
        ? floorArea * additionalFloors * prices.suspendedSlab * multiplier
        : floorArea * additionalFloors * prices.woodFrame * multiplier
      breakdown.push({
        name: project.floorType === 'suspended' ? 'Suspended Slabs' : 'Wood Frame Floors',
        qty: additionalFloors,
        unit: 'floors',
        cost: floorCost,
        note: `${floorArea.toLocaleString()} sq ft × ${additionalFloors} floors`
      })
      materialTotal += floorCost
    }

    if (materials.bricks) {
      const brickCount = Math.ceil(totalWallArea * 7)
      const cost = brickCount * prices.bricks * multiplier
      breakdown.push({ 
        name: 'Bricks', 
        qty: brickCount.toLocaleString(), 
        unit: 'pcs', 
        cost,
        note: `All ${floors} floor(s)`
      })
      materialTotal += cost
    }

    if (materials.lumber) {
      const boardFeet = Math.ceil(perimeterLength * H * 1.5 * floors)
      const cost = boardFeet * prices.lumber * multiplier
      breakdown.push({ 
        name: 'Lumber Framing', 
        qty: boardFeet.toLocaleString(), 
        unit: 'board ft', 
        cost,
        note: `All ${floors} floor(s)`
      })
      materialTotal += cost
    }

    if (materials.roofing) {
      const roofArea = floorArea * 1.15
      const cost = roofArea * prices.roofing * multiplier
      breakdown.push({ 
        name: 'Roofing', 
        qty: roofArea.toFixed(0), 
        unit: 'sq ft', 
        cost,
        note: 'Top floor only'
      })
      materialTotal += cost
    }

    if (materials.drywall) {
      const sheets = Math.ceil(totalWallArea / 32)
      const cost = sheets * prices.drywall * multiplier
      breakdown.push({ 
        name: 'Drywall', 
        qty: sheets, 
        unit: 'sheets', 
        cost,
        note: `All ${floors} floor(s)`
      })
      materialTotal += cost
    }

    if (materials.flooring) {
      const cost = totalFloorArea * prices.flooring * multiplier
      breakdown.push({ 
        name: 'Flooring', 
        qty: totalFloorArea.toLocaleString(), 
        unit: 'sq ft', 
        cost,
        note: `All ${floors} floor(s)`
      })
      materialTotal += cost
    }

    if (materials.windows) {
      const cost = windowCount * prices.windows * multiplier
      breakdown.push({ 
        name: 'Windows', 
        qty: windowCount, 
        unit: 'units', 
        cost,
        note: 'Standard size estimate'
      })
      materialTotal += cost
    }

    if (materials.electrical) {
      const cost = totalFloorArea * prices.electrical * multiplier
      breakdown.push({ 
        name: 'Electrical Rough-in', 
        qty: totalFloorArea.toLocaleString(), 
        unit: 'sq ft', 
        cost,
        note: `All ${floors} floor(s)`
      })
      materialTotal += cost
    }

    if (materials.plumbing) {
      const cost = totalFloorArea * prices.plumbing * multiplier
      breakdown.push({ 
        name: 'Plumbing Rough-in', 
        qty: totalFloorArea.toLocaleString(), 
        unit: 'sq ft', 
        cost,
        note: `All ${floors} floor(s)`
      })
      materialTotal += cost
    }

    const laborCost = materialTotal * (laborRate / 100)
    const subtotal = materialTotal + laborCost
    const contingencyCost = subtotal * (contingencyRate / 100)
    const total = subtotal + contingencyCost

    setResults({
      breakdown,
      materialTotal,
      laborCost,
      contingencyCost,
      total,
      floorArea,
      totalFloorArea,
      totalWallArea,
      floors
    })
    setStep(3)
  }

  const reset = () => {
    setStep(1)
    setProject({ name: '', type: 'residential', length: '', width: '', height: '', floors: '1', slabThickness: '4', floorType: 'slab' })
    setMaterials({ concrete: true, bricks: false, lumber: false, roofing: false, drywall: false, flooring: false, windows: false, electrical: false, plumbing: false })
    setResults(null)
  }

  const downloadPDF = () => {
    const content = `
════════════════════════════════════════════
       CONSTRUCTION COST ESTIMATE
════════════════════════════════════════════

Project: ${project.name || 'Untitled Project'}
Type: ${project.type.charAt(0).toUpperCase() + project.type.slice(1)}
Date: ${new Date().toLocaleDateString()}

────────────────────────────────────────────
BUILDING DIMENSIONS
────────────────────────────────────────────
Length: ${project.length} ft
Width: ${project.width} ft
Wall Height: ${project.height} ft per floor
Floors: ${project.floors}
Floor Type: ${project.floorType === 'slab' ? 'Slab on Grade' : project.floorType === 'suspended' ? 'Suspended Concrete' : 'Wood Frame'}
Slab Thickness: ${project.slabThickness} in

Floor Area (per floor): ${results.floorArea.toLocaleString()} sq ft
Total Floor Area: ${results.totalFloorArea.toLocaleString()} sq ft
Total Wall Area: ${results.totalWallArea.toLocaleString()} sq ft

────────────────────────────────────────────
MATERIALS BREAKDOWN
────────────────────────────────────────────
${results.breakdown.map(item => 
`${item.name}
  Quantity: ${item.qty} ${item.unit}
  Cost: $${item.cost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
  Note: ${item.note}`
).join('\n\n')}

────────────────────────────────────────────
COST SUMMARY
────────────────────────────────────────────
Materials Subtotal:    $${results.materialTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
Labor (${laborRate}%):            $${results.laborCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
Contingency (${contingencyRate}%):      $${results.contingencyCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}

════════════════════════════════════════════
TOTAL ESTIMATE:        $${results.total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
════════════════════════════════════════════

* Prices based on US national averages (2024)
* ${project.type === 'commercial' ? 'Commercial rates applied (+25%)' : project.type === 'apartment' ? 'Apartment rates applied (+15%)' : 'Residential rates applied'}
* This is an estimate only. Actual costs may vary.

────────────────────────────────────────────
Generated by BuildCalc Pro
    `.trim()

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.name || 'estimate'}-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const inputStyle = {
    width: '100%',
    padding: '0.875rem 1rem',
    fontSize: '1rem',
    border: '1px solid #e2e8f0',
    borderRadius: '0.5rem',
    background: '#f8fafc',
    color: '#0f172a',
    boxSizing: 'border-box'
  }

  const selectStyle = {
    ...inputStyle,
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2364748b' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 1rem center'
  }

  const labelStyle = {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#475569',
    marginBottom: '0.375rem'
  }

  const cardStyle = {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '1rem',
    padding: '1.5rem',
    marginBottom: '1rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
  }

  const btnPrimary = {
    width: '100%',
    padding: '1rem',
    fontSize: '1rem',
    fontWeight: 600,
    color: '#ffffff',
    background: '#2563eb',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer'
  }

  const btnSecondary = {
    width: '100%',
    padding: '1rem',
    fontSize: '1rem',
    fontWeight: 600,
    color: '#2563eb',
    background: '#ffffff',
    border: '1px solid #2563eb',
    borderRadius: '0.5rem',
    cursor: 'pointer'
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
    }}>
      {/* Header */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '1rem 1.5rem',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              🏗️ BuildCalc Pro
            </h1>
            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>Construction Cost Estimator</p>
          </div>
          {step > 1 && (
            <button onClick={reset} style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, cursor: 'pointer' }}>
              New Estimate
            </button>
          )}
        </div>
      </header>

      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '1.5rem' }}>
        
        {/* Step 1: Project Details */}
        {step === 1 && (
          <>
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>Step 1 of 2</p>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: '0.25rem 0 0' }}>Project Details</h2>
            </div>

            <div style={cardStyle}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Project Name</label>
                <input
                  type="text"
                  placeholder="e.g., Sunset Apartments"
                  value={project.name}
                  onChange={(e) => setProject({...project, name: e.target.value})}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Building Type</label>
                <select
                  value={project.type}
                  onChange={(e) => setProject({...project, type: e.target.value})}
                  style={selectStyle}
                >
                  <option value="residential">Residential (Single Family)</option>
                  <option value="apartment">Apartment / Multi-Family</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={labelStyle}>Length (ft)</label>
                  <input
                    type="number"
                    placeholder="60"
                    value={project.length}
                    onChange={(e) => setProject({...project, length: e.target.value})}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Width (ft)</label>
                  <input
                    type="number"
                    placeholder="40"
                    value={project.width}
                    onChange={(e) => setProject({...project, width: e.target.value})}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={labelStyle}>Wall Height / Floor (ft)</label>
                  <input
                    type="number"
                    placeholder="10"
                    value={project.height}
                    onChange={(e) => setProject({...project, height: e.target.value})}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Number of Floors</label>
                  <select
                    value={project.floors}
                    onChange={(e) => setProject({...project, floors: e.target.value})}
                    style={selectStyle}
                  >
                    {[1,2,3,4,5,6,7,8,9,10].map(n => (
                      <option key={n} value={n}>{n} {n === 1 ? 'Floor' : 'Floors'}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Foundation Slab (in)</label>
                  <input
                    type="number"
                    placeholder="4"
                    value={project.slabThickness}
                    onChange={(e) => setProject({...project, slabThickness: e.target.value})}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Upper Floor Type</label>
                  <select
                    value={project.floorType}
                    onChange={(e) => setProject({...project, floorType: e.target.value})}
                    style={selectStyle}
                    disabled={project.floors === '1'}
                  >
                    <option value="slab">Slab on Grade Only</option>
                    <option value="suspended">Suspended Concrete</option>
                    <option value="wood">Wood Frame</option>
                  </select>
                </div>
              </div>

              {project.floors !== '1' && (
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem', fontStyle: 'italic' }}>
                  💡 Multi-story selected: Upper floors will use {project.floorType === 'suspended' ? 'suspended concrete slabs' : project.floorType === 'wood' ? 'wood frame construction' : 'slab on grade calculation'}.
                </p>
              )}
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!project.length || !project.width || !project.height}
              style={{
                ...btnPrimary,
                opacity: (!project.length || !project.width || !project.height) ? 0.5 : 1
              }}
            >
              Continue to Materials →
            </button>
          </>
        )}

        {/* Step 2: Materials Selection */}
        {step === 2 && (
          <>
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>Step 2 of 2</p>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: '0.25rem 0 0' }}>Select Materials</h2>
              <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
                {project.floors} floor(s) • {(parseFloat(project.length) * parseFloat(project.width) * parseInt(project.floors)).toLocaleString()} sq ft total
              </p>
            </div>

            <div style={cardStyle}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Structure</p>
              {Object.entries({
                concrete: { label: 'Foundation Concrete', price: '$150/cu yd' },
                bricks: { label: 'Bricks', price: '$0.75/brick' },
                lumber: { label: 'Lumber Framing', price: '$8/board ft' },
                roofing: { label: 'Roofing', price: '$5/sq ft' }
              }).map(([key, val]) => (
                <label key={key} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.875rem 0',
                  borderBottom: '1px solid #f1f5f9',
                  cursor: 'pointer'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <input
                      type="checkbox"
                      checked={materials[key]}
                      onChange={() => setMaterials({...materials, [key]: !materials[key]})}
                      style={{ width: '1.25rem', height: '1.25rem', accentColor: '#2563eb' }}
                    />
                    <span style={{ fontWeight: 500, color: '#0f172a' }}>{val.label}</span>
                  </div>
                  <span style={{ fontSize: '0.875rem', color: '#64748b' }}>{val.price}</span>
                </label>
              ))}
            </div>

            <div style={cardStyle}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Interior & Systems</p>
              {Object.entries({
                drywall: { label: 'Drywall', price: '$15/sheet' },
                flooring: { label: 'Flooring', price: '$8/sq ft' },
                windows: { label: 'Windows', price: '$450/unit' },
                electrical: { label: 'Electrical Rough-in', price: '$4/sq ft' },
                plumbing: { label: 'Plumbing Rough-in', price: '$6/sq ft' }
              }).map(([key, val]) => (
                <label key={key} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.875rem 0',
                  borderBottom: '1px solid #f1f5f9',
                  cursor: 'pointer'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <input
                      type="checkbox"
                      checked={materials[key]}
                      onChange={() => setMaterials({...materials, [key]: !materials[key]})}
                      style={{ width: '1.25rem', height: '1.25rem', accentColor: '#2563eb' }}
                    />
                    <span style={{ fontWeight: 500, color: '#0f172a' }}>{val.label}</span>
                  </div>
                  <span style={{ fontSize: '0.875rem', color: '#64748b' }}>{val.price}</span>
                </label>
              ))}
            </div>

            <div style={cardStyle}>
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                  <label style={labelStyle}>Labor Rate</label>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#2563eb' }}>{laborRate}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="30"
                  value={laborRate}
                  onChange={(e) => setLaborRate(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#2563eb' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' }}>
                  <span>5%</span>
                  <span>30%</span>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                  <label style={labelStyle}>Contingency</label>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#2563eb' }}>{contingencyRate}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={contingencyRate}
                  onChange={(e) => setContingencyRate(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#2563eb' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' }}>
                  <span>0%</span>
                  <span>20%</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <button onClick={() => setStep(1)} style={btnSecondary}>
                ← Back
              </button>
              <button onClick={calculate} style={btnPrimary}>
                Calculate
              </button>
            </div>
          </>
        )}

        {/* Step 3: Results */}
        {step === 3 && results && (
          <>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'inline-block', padding: '0.25rem 0.75rem', background: '#dbeafe', color: '#2563eb', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                {project.type.charAt(0).toUpperCase() + project.type.slice(1)} • {results.floors} Floor{results.floors > 1 ? 's' : ''}
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                {project.name || 'Project'} Estimate
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
                {project.length}' × {project.width}' × {project.height}' per floor • {results.totalFloorArea.toLocaleString()} sq ft total
              </p>
            </div>

            <div style={cardStyle}>
              <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Materials Breakdown
              </h3>
              {results.breakdown.map((item, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.875rem 0',
                  borderBottom: i < results.breakdown.length - 1 ? '1px solid #f1f5f9' : 'none'
                }}>
                  <div>
                    <p style={{ fontWeight: 500, color: '#0f172a', margin: 0 }}>{item.name}</p>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.125rem 0 0' }}>{item.qty} {item.unit}</p>
                    <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: '0.125rem 0 0', fontStyle: 'italic' }}>{item.note}</p>
                  </div>
                  <p style={{ fontWeight: 600, color: '#0f172a', margin: 0, whiteSpace: 'nowrap' }}>
                    ${item.cost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </p>
                </div>
                ))}
            </div>

            <div style={{...cardStyle, background: '#f0f9ff', border: '1px solid #bae6fd'}}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#475569' }}>Materials Subtotal</span>
                <span style={{ color: '#0f172a' }}>${results.materialTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#475569' }}>Labor ({laborRate}%)</span>
                <span style={{ color: '#0f172a' }}>${results.laborCost.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ color: '#475569' }}>Contingency ({contingencyRate}%)</span>
                <span style={{ color: '#0f172a' }}>${results.contingencyCost.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div style={{ borderTop: '2px solid #0ea5e9', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>Total Estimate</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2563eb' }}>
                  ${results.total.toLocaleString(undefined, {minimumFractionDigits: 2})}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <button onClick={() => setStep(2)} style={btnSecondary}>
                ← Edit
              </button>
              <button onClick={downloadPDF} style={btnPrimary}>
                📄 Download
              </button>
            </div>
          </>
        )}
      </main>

      <footer style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.75rem' }}>
       <p>BuildCalc Pro • Precision Estimates • Built by Tony Kioko</p>
      </footer>
    </div>
  )
}

export default App
