"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { patientData } from "@/app/lib/patientData";

// Action Item component
const ActionItem = ({ tooltip }: { tooltip: string }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <span
      className="relative inline-flex items-center ml-2"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-300 cursor-help hover:from-blue-100 hover:to-indigo-100 transition-colors">
        <svg
          className="w-3.5 h-3.5 mr-1.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a1.5 1.5 0 00-1.006-1.006L15.75 7.5l1.035-.259a1.5 1.5 0 001.006-1.006L18 5.25l.259 1.035a1.5 1.5 0 001.006 1.006L20.25 7.5l-1.035.259a1.5 1.5 0 00-1.006 1.006zM16.894 17.801L16.5 19.5l-.394-1.699a2.25 2.25 0 00-1.407-1.407L13 16l1.699-.394a2.25 2.25 0 001.407-1.407L16.5 12.5l.394 1.699a2.25 2.25 0 001.407 1.407L20 16l-1.699.394a2.25 2.25 0 00-1.407 1.407z"
          />
        </svg>
        Action Item
      </span>
      {showTooltip && (
        <div className="absolute z-10 w-72 p-3 text-sm bg-gray-900 text-white rounded-lg shadow-xl bottom-full left-0 mb-2">
          <div className="relative">
            <div className="flex items-start">
              <svg
                className="w-4 h-4 text-blue-400 mr-2 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{tooltip}</span>
            </div>
            <div className="absolute w-3 h-3 bg-gray-900 transform rotate-45 -bottom-1.5 left-12"></div>
          </div>
        </div>
      )}
    </span>
  );
};

// Research content organized by patient and sections
const researchContent = {
  "john-doe": {
    name: "John Doe",
    insurance: "Aetna",
    mainSections: {
      "Condition & Treatment Overview": [
        "Patient has shoulder impingement syndrome due to repetitive overhead work",
        "Key treatment elements include reducing inflammation, correcting biomechanical contributors (posture, strength imbalances), and restoring range of motion",
        "PT plan involves manual therapy for joint mobility and soft tissue extensibility",
        "Therapeutic exercises for rotator cuff and scapular stabilizer strengthening",
        "Stretches for tight posterior capsule/pectoral muscles",
        "Neuromuscular re-education for scapulohumeral rhythm",
        "Patient education on posture and activity modification",
        "Interventions align with best practices for subacromial impingement: combination of manual techniques, exercise, and functional training",
      ],
      "Recommended CPT Codes & Rationale": [
        "97140 (Manual Therapy, 15 min): Used for joint mobilizations and soft tissue work",
        "97110 (Therapeutic Exercise, 15 min): For strengthening exercises targeting rotator cuff and stretching exercises",
        "97112 (Neuromuscular Re-education, 15 min): For scapular stabilizing exercises and postural retraining",
        "97530 (Therapeutic Activities, 15 min): For simulated or real functional tasks like overhead lifting",
        "97035 (Ultrasound) or 97032 (Electrical Stimulation): If used as adjunctive modalities for pain",
      ],
      "Aetna Insurance Billing & Documentation": [
        {
          text: "Patient's plan likely has a 60-day limit for PT per condition, but limit may be tighter depending on plan. The PT plan is 6 weeks (~42 days) which fits under the 60-day limit.",
          actionItem:
            "Provide patient's Policy ID with Aetna on the 'Plan Details' page to look up their limit",
        },
        {
          text: "Document measurable progress within this period to avoid denial of coverage.",
          actionItem:
            "Upload session plans on the 'Patient Plan' page to receive a detailed description of what and how to document in each session, or auto-generate session plans from the same screen",
        },
        "Emphasize improvements in ROM, strength, and function every 2-4 weeks",
        {
          text: "Aetna expects detailed initial plan of care signed by PT and possibly referring provider. Some Aetna plans require physician approval of PT plan within 30 days.",
          actionItem:
            "Enable provider communications to automatically handle and track email communications with the referring provider in-platform.",
        },
        "Once goals are met or plateau reached, Aetna will not cover maintenance therapy.",
        "Follows standard CPT coding rules. Make sure to spend at least 8 minutes on each code.",
        "Avoid billing investigational services (e.g., kinesiotaping for shoulder problems).",
        "Document all education and HEP instruction to support medical necessity",
        "Taper plan from 2x/week to 1x/week after 4 weeks of treatment, as Aetna typically expects tapering frequency as patient improves.",
      ],
      "Codes Utilization & Documentation": [
        "Bill mix of codes per session: 97140, 97110 (x2), 97112 (x1) - four units total",
        "Substitute 97530 for one 97110 on days focused on work simulation. Be sure to use 97530, as work hardening codes (97545/97546) are not typically covered by Aetna.",
        "Include objective measures of status (pain rating, ROM in degrees)",
        "Detail skilled interventions with specifics (e.g., 'Joint mobilization grade III inferior glide')",
        "Document response to treatment (e.g., 'shoulder abduction improved by 10° today')",
        "Record total treatment time for all sessions",
        "Document patient education on posture and HEP",
      ],
      "Maximizing Coverage": [
        "Incorporate home exercises extensively to improve outcomes faster",
        "Avoid non-covered modalities from Aetna's investigational list",
        "Keep physician in loop - Aetna requires physician involvement for extended PT",
        "Some plans may want physician sign-off on PT POC",
      ],
    },
    otherProviders: {
      Cigna: [
        "Remember the 4-unit max rule per session",
        "Typical session: 1 unit 97140, 2 units 97110, 1 unit 97112 (four units)",
        "Cannot exceed 4 timed codes per day - prioritize most important codes",
        "Requires documentation of total treatment time",
        "List minutes spent on each code and total minutes",
        "Include objective progress regularly (at least every 10 visits)",
        "Does not pay for experimental interventions (laser therapy, dry needling)",
        "Typically doesn't require auth for set number of visits",
        "Will deny if documentation requested and goals weren't met/progress not shown",
        "Use combination codes wisely within 4-unit cap",
        "Don't bill for taping separately - consider it part of 97112",
      ],
      UnitedHealthcare: [
        "Often requires prior authorization or initial evaluation submission",
        "Initial authorization might allow 6 visits to start",
        "Must submit clinical notes demonstrating need for additional visits",
        "Emphasize how pain and function are improving but not fully resolved",
        "Starting 2024, UHC Medicare Advantage needs prior auth after eval",
        "Ensure diagnosis code (e.g. M75.4) is on UHC's approved list",
        "Documentation similar to Medicare: functional progress, skilled care rationale",
        "UHC Commercial no longer requires documenting in-and-out times",
        "Record time spent on each service to be audit-ready",
        "Failing to get auth within 10 days could forfeit reimbursement",
      ],
      "Medi-Cal": [
        "Requires written prescription/referral from physician for PT services",
        "Script needs updating every 30 days or if plan changes",
        "All PT beyond initial eval requires authorization (TAR)",
        "Must justify therapy as 'immediately necessary to prevent significant disability'",
        "Frame as preventing loss of job (carpenter) = preventing significant disability",
        "Documentation must be meticulous: prescription, initial eval, progress notes",
        "Might only approve 6-12 visits at a time, requiring re-authorization",
        "Reimbursement rates often lower, some codes bundled",
        "Focus on active codes that demonstrate skill",
        "If patient had Medicare plus Medi-Cal, Medicare rules come first",
      ],
    },
  },
  "emily-smith": {
    name: "Emily Smith",
    insurance: "Cigna",
    mainSections: {
      "Condition & Treatment Overview": [
        "Young athlete with medial meniscus tear being treated non-surgically",
        "PT aims to reduce pain and swelling, restore knee range of motion",
        "Strengthen quadriceps and surrounding musculature",
        "Improve stability to prevent knee giving-way",
        "Treatment includes pain control with ice/compression (especially early)",
        "Manual therapy for joint mobility (patellar mobilizations, soft tissue work)",
        "Progressive therapeutic exercises for strength (quads, hamstrings, hips)",
        "Gradual knee flexion/extension improvement",
        "Neuromuscular re-education for dynamic knee stability and balance",
        "Functional/sport-specific training when appropriate",
        "Emphasizing quad strengthening and proprioceptive training to compensate for meniscal injury",
      ],
      "Cigna Coverage Policy": [
        {
          text: "Keep each visit's billed timed codes to 4 or fewer, unless the patient has a specific PPO plan to exceed the 4-unit limit.",
          actionItem:
            "Provide patient's Policy ID with Cigna on the 'Plan Details' page to look up their limit",
        },
        "Avoid modalities/services Cigna doesn't cover (infrared, H-Wave, taping)",
        "Document total minutes of treatment",
        "Ensure exercises and functional gains are well-documented",
      ],
      "Recommended CPT Codes & Rationale": [
        "97110 (Therapeutic Exercise): Heavily used for knee rehab - open and closed chain exercises",
        {
          title: "Examples include:",
          items: [
            "Quad sets, straight-leg raises, mini-squats",
            "Leg presses, hamstring curls",
            "Gentle ROM exercises (heel slides, stationary bike)",
            "Documentation: '97110 x 2 units - exercises included: left quads strengthening...'",
          ],
        },
        "97112 (Neuromuscular Re-education): Key for balance, proprioception, and gait training",
        {
          title: "Includes:",
          items: [
            "Single-leg balance on various surfaces",
            "Perturbation training, wobble board",
            "NMES to quads if actively facilitating contraction",
            "Documentation: '97112 - performed single-leg stance drills on foam...'",
          ],
        },
        "97530 (Therapeutic Activities): For functional/sport-simulated tasks",
        {
          title: "Later rehab activities:",
          items: [
            "Ladder drills, lateral movements",
            "Simulated pivoting drills",
            "Step-down training, sit-to-stand practice",
            "Documentation should tie activity to function",
          ],
        },
        "97010 (Hot/Cold Pack): Included in Cigna's code list but often not separately reimbursed",
        "97032 (Attended E-stim) or G0283 (Unattended E-stim): Standard e-stim allowed, H-Wave denied",
      ],
      "Cigna Documentation Focus": [
        "In initial documentation, emphasize patient's 4 weeks of failed RICE/rest before PT. Confirm the objective diagnosis via MRI prominently and note that PT is attempting to avoid sugical intervention.Document contraindications to immediate return: positive McMurray, positive Thessaly",
        "2x per week treatment is aggressive for some plans. Note that patient is a high-level athlete requiring supervised progression to prevent re-injury",
        {
          text: "Demonstrate objective improvements at regular intervals",
          actionItem:
            "Upload session plans on the 'Patient Plan' page to receive a detailed description of how to document progress over plan schedule.",
        },
        "Re-test single-leg balance time, hop tests, knee ROM, swelling",
        "After 4 weeks: document improvements (flexion to 140°, quad strength 5/5, etc.)",
        "Document patient compliance and home program education. As patient is a minor, parental involvement in home program should be documented",
        "Include short-term and long-term goals in initial evaluation",
        "Progress reports required intermittently (at least every 4 weeks or 10 visits)",
        "List minutes per code and sum for each visit",
        "Example: Therapeutic Exercises: 30 min (97110 x2), Neuromuscular re-ed: 15 min (97112 x1)",
      ],
      "Insurance Authorization": [
        "Cigna typically doesn't require prior auth for set number of PT visits for minors",
        {
          text: "Some plans use third-party reviewers (ASH - American Specialty Health)",
          actionItem:
            "Provide patient's Policy ID with Cigna on the 'Plan Details' page to look up their limit",
        },
        "ASH may initially allow 6 visits, then require progress note for more",
        "Submit objective data to justify additional visits",
        "Strong justification: showing improvement and aiming to return to sport",
        "Some employer plans may have hard visit limits (e.g., 20 PT visits/year)",
        "Front-load education and home program if visit limits exist",
      ],
      "Maximizing Coverage": [
        "Use full 4 units each session to maximize therapy",
        "Typical session: 2 units 97110, 1 unit 97112, 1 unit 97530",
        "Alternate codes across sessions to cover all needs",
        "Some days emphasize ROM/manual work: 1 unit 97140, 1-2 units 97110, 1 unit 97112",
        "Keep sessions around 60 minutes of billable time",
        "Encourage family to utilize school athletic trainer services in addition",
        "Group therapy (97150) covered but not commonly used for individual ortho cases",
      ],
    },
    otherProviders: {
      Aetna: [
        "Often allows more flexibility in units per visit (no strict 4-unit rule)",
        "Might limit total days (60 days or certain number of visits)",
        "Must document this isn't just sports performance enhancement",
        "Frame as restoring normal function after injury, not enhancing beyond baseline",
        "Aim to get back to pre-injury status (normal for her age)",
        "Doesn't cover formal maintenance or long-term conditioning",
        "Document specific functional deficits (which Emily has: can't squat, can't play soccer)",
        "Won't cover ongoing training to improve beyond what was lost",
      ],
      UnitedHealthcare: [
        "Typically no 4 unit limit",
        "Might require prior auth for teen on parents' plan",
        "Many HMO plans use Optum - might allow initial 6-8 visits, then require medical review,",
        "Careful not to over-utilize visits without clear need",
        "May deny further visits if already functional",
      ],
      "Medi-Cal": [
        "Can be used if patient is income eligible or as secondary coverage",
        "Tends to approve therapy if avoiding surgery (cost-saving)",
        "Might question frequency for 17-year-old",
        "Good documentation and MD support needed",
        "At 17, covered under EPSDT mandate",
        "Legally must cover all medically necessary services for children/teens",
        "EPSDT could allow more visits than normally allowed for adults",
        "Reference EPSDT if hitting barriers: 'Under EPSDT, continued PT warranted...'",
      ],
    },
  },
  "maria-garcia": {
    name: "Maria Garcia",
    insurance: "Medi-Cal",
    mainSections: {
      "Condition & Treatment Overview": [
        "Chronic low back pain with deconditioning and balance issues",
        "Treatment addresses pain management, improve core and lower extremity strength",
        "Increase flexibility and enhance balance/mobility for fall prevention",
        "Plan includes modalities for pain relief (heat, TENS)",
        "Graded exercise program focusing on core stabilization",
        "Lower-body strengthening exercises",
        "Stretching of tight muscles (hip flexors, hamstrings)",
        "Aquatic therapy to enable low-impact exercise",
        "Balance and gait training",
        "Extensive patient education in body mechanics and home exercises",
        "Goal: improve ability to perform daily activities and prevent disability",
      ],
      "Medi-Cal Requirements": [
        "Requires doctor's prescription for PT",
        "Authorization needed for all visits including initial eval",
        "Must justify in TAR how PT will prevent 'significant disability' or 'alleviate severe pain'",
        "Per Medi-Cal's medical necessity definition",
        "California Medi-Cal doesn't have hard visit cap per year",
        "Each request is reviewed individually",
        "Initial auth typically for 6 or 12 visits",
        "Requested 24 visits (2x/week * 12 weeks) - likely approved in smaller chunks",
        "Need progress notes to justify continuing beyond first authorization",
        "Emphasize objective gains tied to function",
        "Example: 'Timed Up & Go improved from 16s to 12s, reducing fall risk'",
      ],
      "Recommended CPT Codes & Rationale": [
        "97110 (Therapeutic Exercise): Core and lower extremity strengthening",
        {
          title: "Exercises include:",
          items: [
            "Pelvic tilts, partial crunches, isometric core exercises",
            "Bridging, hip strengthening (clamshells, side-lying leg raises)",
            "General conditioning exercises",
            "Gentle stretching (hamstring, lumbar rotation)",
            "Documentation: '97110 - performed 20 min core stabilization...'",
          ],
        },
        "97112 (Neuromuscular Re-education): Balance training, proprioceptive exercises",
        "97116 (Gait Training): Specifically for gait training exercises",
        {
          title: "Gait training includes:",
          items: [
            "Walking with improved posture and reciprocal arm swing",
            "Proper sequencing with single-point cane",
            "Stepping over threshold, ascending stairs with railing",
            "Documentation: 'Gait training: practiced walking with improved posture...'",
          ],
        },
        "97530 (Therapeutic Activities): Functional training",
        {
          title: "Activities include:",
          items: [
            "Sit-to-stand transfers",
            "Lifting mechanics training",
            "Simulated ADLs",
            "Proper body mechanics for bending/lifting",
            "Documentation: '97530 - instructed in safe lifting technique...'",
          ],
        },
        "97140 (Manual Therapy): Joint mobilizations and soft tissue massage",
        "97113 (Aquatic Therapy): If facility available, once weekly",
        "97010/97014/G0283: Hot packs and TENS typically bundled, not separately paid",
      ],
      "Medi-Cal Documentation & Authorization": [
        "Fill out Treatment Authorization Request (TAR) form with:",
        {
          title: "Required elements:",
          items: [
            "Diagnosis codes (M47.816 - spondylosis, M62.3 - muscle weakness, R26.81 - unsteadiness)",
            "Objective findings (ROM, TUG time, etc.)",
            "Functional limitations (can't walk >10 min)",
            "Why PT needed (prevent falls/injury, avoid decline)",
            "Planned treatment with frequency/duration",
            "Each intervention (include aquatic therapy if used)",
            "Physician's prescription attached",
          ],
        },
        "Emphasize recent functional decline indicates need for skilled intervention",
        "Frame as preventing likely hospitalization from fall or pain exacerbation",
        "Medi-Cal manual states authorization limited to services necessary to:",
        {
          title: "",
          items: [
            "Prevent hospitalization or disability",
            "Continue recovery from hospitalization",
          ],
        },
        "Mention if no prior treatments (no duplication)",
        "Progress reports for extensions: submit after 12 visits with updated metrics",
        "Example: 'pain reduced to 3/10, TUG now 12s, can walk 15 min vs 5 min prior'",
      ],
      "Maximizing Coverage Strategies": [
        "Broad array of services addresses all needs and allows billing multiple codes",
        "Single land session could include:",
        {
          title: "",
          items: [
            "Heat (no bill)",
            "Manual therapy (97140, 1 unit)",
            "Therapeutic exercise (97110, 2 units)",
            "Gait training (97116, 1 unit)",
            "TENS (no bill or G0283 small)",
          ],
        },
        "Aquatic day: 97113 for 2-3 units plus possible land-based exercise",
        "Careful not to include non-covered experimental treatments",
        "Telehealth option: California Medicaid pays for telehealth PT (with 95 modifier)",
        "Community resources: connect with senior exercise classes for maintenance",
        "Document long-term fitness plan - shows proactive discharge planning",
      ],
      "Compliance & Avoiding Denials": [
        "Audit risk significant with Medicaid",
        "Session notes must match billing exactly",
        "If billing 97116 gait training, note must explicitly describe gait training",
        "Time tracking: ensure distinct time for each code, no double-counting",
        "Document attendance and attempts to reschedule if missed",
        "Medi-Cal may deny if frequency not as prescribed (non-compliance)",
        "Use outcome measures (Oswestry Disability Index) to strengthen documentation",
        "Produce detailed discharge summary with objective improvements",
        "State patient can function independently with home program",
      ],
    },
    otherProviders: {
      Medicare: [
        "At 60, not Medicare age unless disability Medicare",
        "Would require proper eval CPT code (97161/97162/97163)",
        "Likely moderate or high complexity given comorbidities",
        "Track therapy dollar usage against threshold (~$2120 for PT/SLP)",
        "Use KX modifier when exceeding threshold",
        "Value-based care emphasis - must show functional improvement",
        "If dual eligible (Medicare + Medi-Cal), Medicare primary",
        "Medicare doesn't pay for hot/cold separate (bundled)",
        "Unattended e-stim G0283 only in certain circumstances",
        "97530 covered but audited vs 97110 to ensure not duplicate billing",
        "Rule: 97110 for impairments, 97530 for functional tasks",
        "Require impairment documentation for gait/neuromuscular re-ed",
      ],
      Aetna: [
        "Would generally cover services but may have visit limits",
        "Example: 60-day limit for condition",
        "Doesn't cover some experimental treatments for chronic LBP",
        "Focus on well-accepted treatments",
        "Document progress regularly to justify continuation",
      ],
      Cigna: [
        "Would need to stay within 4-unit per session limit",
        "97113 (aquatic therapy) covered when criteria met",
        "Varies on aquatic therapy coverage but generally accepts when justified",
        "Doesn't cover some experimental treatments",
      ],
      UnitedHealthcare: [
        "Would cover services if medically necessary",
        "Often requires prior authorization",
        "Covers aquatic therapy if medically necessary",
        "Sometimes requires prior auth with justification for aquatic therapy",
      ],
    },
  },
};

export default function RecommendationPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.patientId as string;
  const [patientInfo, setPatientInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("primary");

  useEffect(() => {
    if (patientId && patientData[patientId as keyof typeof patientData]) {
      const originalData = patientData[patientId as keyof typeof patientData];
      const storedData = sessionStorage.getItem(`patient-${patientId}`);
      const patientFormData = storedData
        ? JSON.parse(storedData)
        : originalData;

      setPatientInfo(patientFormData);
      setLoading(false);
    } else {
      router.push("/");
    }
  }, [patientId, router]);

  const handleBack = () => {
    router.push(`/insurance/${patientId}`);
  };

  const handleFinish = () => {
    // Clear session storage and return to home
    sessionStorage.removeItem(`patient-${patientId}`);
    sessionStorage.removeItem(`insurance-${patientId}`);
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading recommendations...</div>
      </div>
    );
  }

  const content = researchContent[patientId as keyof typeof researchContent];
  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">
          No recommendations available for this patient.
        </div>
      </div>
    );
  }

  // Show "in progress" for Maria Garcia
  if (patientId === "maria-garcia") {
    return (
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handleBack}
                className="text-gray-600 hover:text-gray-900 flex items-center"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to Insurance
              </button>
              <div className="text-sm text-gray-500">
                Step 3 of 3: Treatment Recommendation
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Treatment Recommendation
            </h1>
            <div className="w-20 h-1 bg-primary-500 mb-4"></div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold text-lg mr-4">
                  {patientInfo?.Name?.split(" ")
                    .map((n: string) => n[0])
                    .join("")}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {patientInfo?.Name}
                  </h2>
                  <p className="text-gray-600">
                    {patientInfo?.Gender}, {patientInfo?.Age} years old •{" "}
                    {patientInfo?.Occupation}
                  </p>
                </div>
              </div>
              <div className="bg-primary-50 px-4 py-2 rounded-lg">
                <p className="text-sm text-gray-600">Insurance Provider</p>
                <p className="text-lg font-semibold text-primary-700">
                  {content.insurance}
                </p>
              </div>
            </div>
          </div>

          {/* In Progress Message */}
          <div className="bg-white rounded-lg shadow-sm p-12">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="animate-pulse">
                  <svg
                    className="w-16 h-16 text-primary-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                Recommendation in Progress
              </h2>
              <p className="text-gray-600 max-w-md mx-auto">
                Our AI is analyzing the complex requirements for Medi-Cal
                coverage. The recommendation will be available shortly.
              </p>
              <div className="mt-8">
                <div className="flex justify-center space-x-2">
                  <div
                    className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
            <div className="flex justify-center">
              <button
                onClick={handleBack}
                className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors flex items-center"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to Insurance Information
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const renderBulletList = (items: any[]) => {
    return (
      <ul className="space-y-2">
        {items.map((item, index) => {
          if (typeof item === "string") {
            return (
              <li key={index} className="flex">
                <span className="text-primary-500 mr-2">•</span>
                <span className="text-gray-700">{item}</span>
              </li>
            );
          } else if (typeof item === "object" && item.text && item.actionItem) {
            // Item with action item pill
            return (
              <li key={index} className="flex">
                <span className="text-primary-500 mr-2">•</span>
                <span className="text-gray-700">
                  {item.text}
                  <ActionItem tooltip={item.actionItem} />
                </span>
              </li>
            );
          } else if (typeof item === "object" && item.title && item.items) {
            return (
              <li key={index} className="ml-4">
                <p className="text-gray-700 font-medium mb-1">{item.title}</p>
                <ul className="ml-4 space-y-1">
                  {item.items.map((subItem: string, subIndex: number) => (
                    <li key={subIndex} className="flex">
                      <span className="text-gray-400 mr-2">◦</span>
                      <span className="text-gray-600">{subItem}</span>
                    </li>
                  ))}
                </ul>
              </li>
            );
          }
          return null;
        })}
      </ul>
    );
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handleBack}
              className="text-gray-600 hover:text-gray-900 flex items-center"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Insurance
            </button>
            <div className="text-sm text-gray-500">
              Step 3 of 3: Treatment Recommendation
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Treatment Recommendation
          </h1>
          <div className="w-20 h-1 bg-primary-500 mb-4"></div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold text-lg mr-4">
                {patientInfo?.Name?.split(" ")
                  .map((n: string) => n[0])
                  .join("")}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  {patientInfo?.Name}
                </h2>
                <p className="text-gray-600">
                  {patientInfo?.Gender}, {patientInfo?.Age} years old •{" "}
                  {patientInfo?.Occupation}
                </p>
              </div>
            </div>
            <div className="bg-primary-50 px-4 py-2 rounded-lg">
              <p className="text-sm text-gray-600">Insurance Provider</p>
              <p className="text-lg font-semibold text-primary-700">
                {content.insurance}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("primary")}
                className={`py-3 px-6 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "primary"
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {content.insurance} Coverage Guidelines
              </button>
              <button
                onClick={() => setActiveTab("other")}
                className={`py-3 px-6 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "other"
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Other Provider Considerations
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === "primary" ? (
            // Primary Insurance Content
            Object.entries(content.mainSections).map(
              ([sectionTitle, sectionContent]) => (
                <div
                  key={sectionTitle}
                  className="bg-white rounded-lg shadow-sm p-6"
                >
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    {sectionTitle}
                  </h3>
                  {renderBulletList(sectionContent)}
                </div>
              )
            )
          ) : (
            // Other Provider Considerations
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Other Provider Demo Considerations
              </h3>
              <div className="space-y-6">
                {Object.entries(content.otherProviders).map(
                  ([provider, points]) => (
                    <div
                      key={provider}
                      className="border-l-4 border-gray-200 pl-6"
                    >
                      <h4 className="text-lg font-semibold text-gray-800 mb-3">
                        {provider}
                      </h4>
                      {renderBulletList(points)}
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
          <div className="flex justify-between items-center">
            <button
              onClick={handleBack}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors flex items-center"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back
            </button>

            <div className="flex space-x-4">
              <button
                onClick={() => window.print()}
                className="px-6 py-3 border border-primary-600 text-primary-600 font-medium rounded-md hover:bg-primary-50 transition-colors flex items-center"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2z"
                  />
                </svg>
                Print Recommendation
              </button>

              <button
                onClick={handleFinish}
                className="px-6 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition-colors flex items-center"
              >
                Complete Assessment
                <svg
                  className="w-5 h-5 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
