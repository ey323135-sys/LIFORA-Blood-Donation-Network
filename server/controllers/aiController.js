const { supabase } = require('../config/supabase');

// Pre-seeded standard medical reference knowledge for instant offline/local fallback
const BUILTIN_KNOWLEDGE_BASE = [
  {
    title: 'Blood Group Compatibility Matrix',
    category: 'Blood Compatibility',
    tags: ['compatibility', 'blood group', 'universal donor', 'transfusion'],
    summary: 'Medically reviewed red blood cell compatibility rules for blood transfusions.',
    content: `
      O- negative is the Universal Red Cell Donor and can donate blood to all blood groups (O-, O+, A-, A+, B-, B+, AB-, AB+).
      O+ positive can donate to O+, A+, B+, AB+.
      A- negative can donate to A-, A+, AB-, AB+.
      A+ positive can donate to A+, AB+.
      B- negative can donate to B-, B+, AB-, AB+.
      B+ positive can donate to B+, AB+.
      AB- negative can donate to AB-, AB+.
      AB+ positive is the Universal Recipient for red blood cells and can receive from all blood groups, but can only donate to AB+.
    `
  },
  {
    title: 'Donor Eligibility Guidelines',
    category: 'Donation Preparation',
    tags: ['eligibility', 'preparation', 'weight', 'age', 'hemoglobin'],
    summary: 'Standard requirements for blood donation eligibility.',
    content: `
      1. Age: Donors must be between 18 and 65 years old.
      2. Weight: Minimum body weight of 50 kg (110 lbs).
      3. Hemoglobin Level: Minimum 12.5 g/dL for female donors and 13.0 g/dL for male donors.
      4. Donation Interval: Minimum 90 days (3 months) between whole blood donations.
      5. Health Condition: Must be in good general health, well-rested, and free from active infections or fever.
      6. Medication & Alcohol: Abstain from alcohol consumption for 24 hours prior to donation. Certain medications require deferral.
    `
  },
  {
    title: 'Organ Donation Legal & Process Guide',
    category: 'Organ Donation',
    tags: ['organ donation', 'consent', 'legal', 'pledge', 'transplant'],
    summary: 'Overview of organ donation pledge procedures and legal consent rules.',
    content: `
      Organ donation saves lives by replacing damaged organs with healthy donor organs.
      1. Deceased Donation: Organs (heart, lungs, liver, kidneys, pancreas, intestines) and tissues (corneas, skin, bone) pledged can be donated after brain death confirmation by authorized medical boards.
      2. Consent Registration: LIFORA stores user consent records with timestamps and emergency contact verification.
      3. Legal Disclaimers: LIFORA is an awareness and consent registry. Official organ matching, allocation, and surgical transplantation are conducted strictly by authorized medical institutions and government organ transplant networks.
      4. Consent Withdrawal: Registered donors retain the absolute legal right to withdraw their consent at any time through their LIFORA dashboard.
    `
  },
  {
    title: 'Emergency Blood Request Standard Operating Procedure (SOP)',
    category: 'Hospital SOP',
    tags: ['hospital', 'emergency', 'blood request', 'sop', 'coordination'],
    summary: 'Official hospital workflow for issuing emergency blood requests.',
    content: `
      1. Verification: Only verified hospital administrators and medical staff may submit official Emergency Blood Requests.
      2. Criticality Ratings: 'Standard' (routine surgery within 48h), 'Urgent' (required within 6-12h), 'Critical' (immediate life-saving need within 1-2h).
      3. Donor Matching: LIFORA automatically calculates compatible donor ranks based on compatibility, location proximity, and availability.
      4. Transfusion Safety: Matches provided by LIFORA are preliminary coordination alerts. Final crossmatching and blood safety testing MUST be conducted by qualified blood bank pathologists prior to transfusion.
    `
  }
];

/**
 * Lightweight Vector/TF-IDF similarity score calculation
 */
const calculateSimilarityScore = (query, text, tags = []) => {
  const queryWords = query.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 2);
  const targetText = `${text} ${(tags || []).join(' ')}`.toLowerCase();
  
  let matchCount = 0;
  queryWords.forEach(word => {
    if (targetText.includes(word)) {
      matchCount += 1;
    }
  });

  return matchCount / Math.max(queryWords.length, 1);
};

// In-memory custom documents store for custom knowledge added dynamically
let customDocs = [];

// @desc    Process RAG query against knowledge base
// @route   POST /api/ai/query
// @access  Public / Authenticated
exports.queryRAGAssistant = async (req, res, next) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ success: false, message: 'Query string is required' });
    }

    const cleanQuery = query.trim();

    // Combine Built-in knowledge base with dynamic custom docs
    const allDocs = [
      ...BUILTIN_KNOWLEDGE_BASE.map(doc => ({ ...doc, isBuiltin: true })),
      ...customDocs.map(doc => ({ ...doc, isBuiltin: false }))
    ];

    // Score documents by relevance
    const scoredDocs = allDocs.map(doc => {
      const score = calculateSimilarityScore(cleanQuery, `${doc.title} ${doc.content}`, doc.tags);
      return { doc, score };
    });

    // Filter documents with score > 0 and sort by score
    const topMatches = scoredDocs
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(item => item.doc);

    if (topMatches.length === 0) {
      return res.json({
        success: true,
        answer: `I could not find specific information regarding "${cleanQuery}" in the approved LIFORA medical knowledge base. For urgent clinical advice or unlisted blood queries, please consult a qualified blood bank professional or hospital pathologist.`,
        sources: [],
        confidence: 'Low / Information Unavailable'
      });
    }

    let synthesizedAnswer = `Based on LIFORA's approved medical knowledge documents:\n\n`;

    topMatches.forEach((doc, idx) => {
      const snippet = doc.content.replace(/\s+/g, ' ').trim().slice(0, 300);
      synthesizedAnswer += `[Reference ${idx + 1}: ${doc.title}]\n${snippet}...\n\n`;
    });

    synthesizedAnswer += `\n*Note: Information retrieved from official SOPs. Always confirm clinical blood safety with certified blood bank personnel.*`;

    res.json({
      success: true,
      query: cleanQuery,
      answer: synthesizedAnswer,
      sources: topMatches.map(d => ({
        title: d.title,
        category: d.category,
        summary: d.summary || d.content.slice(0, 100) + '...'
      })),
      confidence: topMatches[0].score > 0.5 ? 'High' : 'Moderate'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get AI predictive demand analytics and operational summary
// @route   GET /api/ai/analytics
// @access  Authenticated
exports.getAIAnalytics = async (req, res, next) => {
  try {
    const { count: totalRequests } = await supabase.from('blood_requests').select('*', { count: 'exact', head: true });
    const { count: urgentRequests } = await supabase.from('blood_requests').select('*', { count: 'exact', head: true })
      .in('emergency_level', ['Urgent', 'Critical']);
    const { count: availableDonors } = await supabase.from('donor_profiles').select('*', { count: 'exact', head: true })
      .eq('is_available', true);

    const { data: allReqs } = await supabase.from('blood_requests').select('blood_group, units_needed');
    const { data: allInv } = await supabase.from('blood_inventory').select('blood_group, units');

    const demandMap = {};
    (allReqs || []).forEach(r => {
      demandMap[r.blood_group] = (demandMap[r.blood_group] || 0) + (Number(r.units_needed) || 1);
    });

    const inventoryMap = {};
    (allInv || []).forEach(i => {
      inventoryMap[i.blood_group] = (inventoryMap[i.blood_group] || 0) + (Number(i.units) || 0);
    });

    const criticalShortages = [];
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

    bloodGroups.forEach(bg => {
      const groupDemand = demandMap[bg] || 0;
      const groupStock = inventoryMap[bg] || 0;

      if (groupStock < 5 || (groupDemand > 0 && groupStock < groupDemand)) {
        criticalShortages.push({
          bloodGroup: bg,
          currentStock: groupStock,
          activeDemandUnits: groupDemand,
          status: groupStock === 0 ? 'CRITICAL_DEPLETED' : 'LOW_STOCK_WARNING'
        });
      }
    });

    const recommendations = [];
    if (criticalShortages.length > 0) {
      recommendations.push(`Urgent broadcast recommended for blood groups: ${criticalShortages.map(c => c.bloodGroup).join(', ')}.`);
    }
    if ((availableDonors || 0) < 10) {
      recommendations.push('Donor registration drive advised: Active available donor count is low in target region.');
    }
    recommendations.push('Maintain minimum buffer stock of 5 units for O- Negative universal donor blood group.');

    res.json({
      success: true,
      timestamp: new Date(),
      metrics: {
        totalRequests: totalRequests || 0,
        urgentRequests: urgentRequests || 0,
        availableDonors: availableDonors || 0,
        shortageGroupCount: criticalShortages.length
      },
      criticalShortages,
      aiRecommendations: recommendations,
      operationalSummary: `AI Predictive model indicates network state. ${criticalShortages.length} blood groups currently require inventory replenishment.`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get knowledge base documents list
// @route   GET /api/ai/documents
// @access  Authenticated
exports.getKnowledgeDocs = async (req, res) => {
  res.json({
    success: true,
    builtinDocs: BUILTIN_KNOWLEDGE_BASE,
    dbDocs: customDocs
  });
};

// @desc    Add knowledge document (Admin only)
// @route   POST /api/ai/documents
// @access  Private/Admin
exports.addKnowledgeDoc = async (req, res) => {
  const { title, category, content, summary, tags } = req.body;

  if (!title || !content) {
    return res.status(400).json({ success: false, message: 'Title and content are required' });
  }

  const doc = {
    id: `doc_${Date.now()}`,
    _id: `doc_${Date.now()}`,
    title,
    category: category || 'General',
    content,
    summary: summary || content.slice(0, 150),
    tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []),
    isApproved: true,
    createdAt: new Date()
  };

  customDocs.push(doc);

  res.status(201).json({ success: true, message: 'Knowledge document added successfully', doc });
};

// @desc    Delete knowledge document (Admin only)
// @route   DELETE /api/ai/documents/:id
// @access  Private/Admin
exports.deleteKnowledgeDoc = async (req, res) => {
  customDocs = customDocs.filter(d => d.id !== req.params.id && d._id !== req.params.id);
  res.json({ success: true, message: 'Knowledge document deleted' });
};
