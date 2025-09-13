export const patientData = {
  "john-doe": {
    "PatientID": "PT-001",
    "Name": "John Doe",
    "Age": 45,
    "Gender": "Male",
    "Occupation": "Carpenter",
    "InsuranceProvider": "Aetna",
    "PlanStartDate": "2025-08-19",
    "Subjective": {
      "ChiefComplaint": "Right shoulder pain and limited motion, insidious onset over past 3 months.",
      "HistoryOfPresentIllness": "Patient reports gradually increasing right shoulder pain, worse with overhead activities at work (carpentry). No specific injury recalled. Pain began ~3 months ago, now worsening. Describes pain as a sharp pinch in the top of shoulder when lifting arm overhead, and an ache at rest. Difficulty with hammering above shoulder height and lifting objects overhead. Taking ibuprofen with some relief.",
      "PainLevel": "6/10 at worst, 2/10 at rest",
      "PainPattern": "Worse at end of work day, especially after repetitive overhead tasks. Night pain occasionally when lying on right side.",
      "PriorInterventions": "Tried rest and over-the-counter NSAIDs; no formal therapy yet. Has been doing some self-prescribed stretching without much improvement.",
      "PastMedicalHistory": "No significant past injuries to shoulder. Past medical history significant for hypertension (well-controlled). No prior surgeries.",
      "Medications": "Lisinopril for HTN, ibuprofen as needed for shoulder pain",
      "FunctionalStatus": "Independent in ADLs but avoids heavy overhead lifting. Difficulty with work tasks requiring prolonged overhead reaching or carrying >20 lbs above shoulder. Reports needing help at home with placing items on high shelves.",
      "PatientGoals": "Reduce shoulder pain, regain full motion and strength to perform work tasks (overhead hammering, lifting) without difficulty. Avoid surgery and continue working as a carpenter."
    },
    "Objective": {
      "Observation": "Moderate rounded shoulder posture, mild forward head. Right shoulder slightly lower than left. No muscle atrophy noted.",
      "Palpation": "Tenderness at right subacromial area and anterior shoulder (biceps tendon region). No obvious swelling or deformity.",
      "RangeOfMotion": {
        "ShoulderFlexion": "Right: 130° active (with pain at end-range), Left: 170°",
        "ShoulderAbduction": "Right: 120° active (painful arc 90-120°), Left: 170°",
        "ShoulderExternalRotation": "Right: 60° (at 90° abduction), Left: 90°",
        "ShoulderInternalRotation": "Right: T12 level behind back, Left: T8 level"
      },
      "Strength": {
        "RightDeltoid": "4/5 (pain-limited)",
        "RightSupraspinatus": "4/5 (pain and mild weakness on empty can test)",
        "RightExternalRotators": "4/5",
        "RightInternalRotators": "5/5",
        "ScapularMuscles": "Lower trapezius 4/5, middle trapezius 4/5 on manual resistance; serratus anterior 4/5 with wall push-up test (mild winging observed)"
      },
      "SpecialTests": {
        "HawkinsKennedy": "Positive on right (pain with internal rotation at 90° flexion)",
        "Neer": "Positive on right (pain at end-range forward flexion)",
        "EmptyCan": "Positive for pain/weakness (supraspinatus) on right",
        "SpeedTest": "Mild pain in bicipital groove",
        "DropArm": "Negative (no full tear suspected)"
      },
      "Neurologic": "Sensation intact in right upper extremity. Deep tendon reflexes 2+ at biceps/triceps. No radicular symptoms.",
      "FunctionalTests": "Pain and difficulty with reaching overhead (could not fully hang drywall overhead during simulation). Unable to do pain-free push-up (due to shoulder)."
    },
    "Assessment": {
      "Diagnosis": "Right Shoulder Impingement Syndrome (ICD-10: M75.4)",
      "ClinicalImpression": "Findings consistent with subacromial impingement, likely due to repetitive overhead activities. Contributing factors: poor posture (forward shoulders), rotator cuff and scapular muscle weakness, and tight posterior shoulder capsule leading to altered mechanics. No signs of full rotator cuff tear (strength is mildly reduced but present). Prognosis is good for recovery with conservative management. Patient is motivated to return to full work duties."
    },
    "Plan": {
      "TreatmentPlan": "Skilled PT 2-3x/week for 6 weeks. Emphasis on reducing inflammation and improving subacromial space, then strengthening. Plan includes: education on activity modification and posture; manual therapy (glenohumeral joint mobilizations Grade I-II for pain, posterior capsule stretches; soft tissue mobilization to pec minor and posterior shoulder); therapeutic exercises for rotator cuff strengthening (theraband external rotations, scaption exercises) and scapular stabilizer strengthening (lower trapezius, serratus anterior); stretching for posterior capsule and pectoralis muscles; neuromuscular re-ed for scapulohumeral rhythm (wall slides, scapular setting exercises); modalities PRN for pain (ice after sessions, consider IFC or ultrasound if pain severe). Will progressively introduce functional tasks simulating work (overhead lifting mechanics) as pain decreases.",
      "ShortTermGoals": [
        "Reduce right shoulder pain from 6/10 to 3/10 with overhead work in 3 weeks.",
        "Improve right shoulder flexion AROM from 130° to at least 150° in 3 weeks.",
        "Increase right shoulder abduction painless arc to 150° in 3-4 weeks."
      ],
      "LongTermGoals": [
        "Restore full, pain-free AROM of right shoulder (170° flexion/abduction) in 6-8 weeks.",
        "Improve right shoulder strength to 5/5 in rotator cuff and scapular muscles to enable overhead lifting of 20 lbs by 8 weeks.",
        "Independently perform home exercise program for shoulder maintenance and posture correction by discharge.",
        "Return to full work duties as a carpenter, including overhead tasks, without pain or compensations in 8 weeks."
      ],
      "FrequencyDuration": "3x/week for 6 weeks, then re-evaluate. Total ~18 visits authorized."
    }
  },
  "emily-smith": {
    "PatientID": "PT-002",
    "Name": "Emily Smith",
    "Age": 17,
    "Gender": "Female",
    "Occupation": "High School Student / Soccer Player",
    "InsuranceProvider": "Cigna",
    "PlanStartDate": "2025-08-19",
    "Subjective": {
      "ChiefComplaint": "Left knee pain and instability after soccer injury.",
      "HistoryOfPresentIllness": "Injury occurred 4 weeks ago during a soccer match: planted left foot and twisted to change direction, felt a 'pop' and immediate pain inside the left knee. Knee swelled that day and had difficulty walking for a week. Saw orthopedic MD: MRI confirmed a medial meniscus tear, no ACL tear. Ortho recommended a trial of physical therapy (no surgery at this time). Currently, patient reports intermittent sharp pain in medial knee with twisting or deep bending, and feelings of the knee 'giving way' occasionally.",
      "PainLevel": "Current 2/10, up to 6/10 with certain movements (squatting or pivoting).",
      "Symptoms": "Knee stiffness after prolonged sitting, mild swelling towards end of day if active. No locking, but does have catching sensation at times. Uses a knee brace with hinge during sports practice (currently not playing, just light drills).",
      "PreviousTreatment": "Rest, ice, compression, elevation (RICE) initially. Took naproxen for 1 week post-injury. No prior PT.",
      "PastMedicalHistory": "No prior injuries or surgeries. Generally healthy.",
      "Medications": "None currently (occasional ibuprofen if knee is sore).",
      "FunctionalStatus": "Walking with normal gait now, but avoids running. Cannot fully squat or kneel on left. Has not returned to soccer games, only light jogging and footwork drills with brace. Struggles with stairs when carrying heavy schoolbooks (pain ascending stairs).",
      "PatientGoals": "Heal knee to avoid surgery. Return to playing competitive soccer at pre-injury level. Regain full strength and confidence in the knee, no giving-way episodes."
    },
    "Objective": {
      "Observation": "Slight effusion in left knee (mild puffiness). No obvious muscle atrophy in thighs (left quad maybe slightly smaller than right by girth measurement 45cm vs 46cm).",
      "Gait": "Antalgic gait initially post-injury, now normal walking pattern. Able to walk on heels and toes. Mild hesitation on left during jogging.",
      "RangeOfMotion": {
        "KneeFlexion": "Left: 130° active (tight end-feel, pain at extreme); Right: 140°",
        "KneeExtension": "Left: lacks ~5° of full extension (5° flexion contracture), Right: 0° (full)."
      },
      "Strength": {
        "LeftQuadriceps": "4-/5 (slight weakness, pain at end-range extension effort)",
        "LeftHamstrings": "4+/5",
        "LeftHipAbductors": "4+/5 (to assess dynamic knee stability)",
        "LeftGastroc": "5/5",
        "RightLEComparison": "Right quad 5/5, hamstrings 5/5 for baseline"
      },
      "SpecialTests": {
        "McMurray": "Positive on left – pain and audible click at medial joint line on internal rotation of tibia.",
        "ThessalyTest": "Positive at 20° knee bend – patient has medial joint line pain with weight-bearing twist on left leg.",
        "Lachman": "Negative (firm end-feel, no ACL tear signs).",
        "AnteriorDrawer": "Negative.",
        "VarusValgusStress": "No laxity at 0° or 30° (MCL/LCL intact).",
        "JointLineTenderness": "Medial joint line tender to palpation on left."
      },
      "Palpation": "Tender along medial joint line of left knee. Mild warmth compared to right. No tenderness over MCL or patellar tendon. Patellar mobility slightly reduced (mild medial-lateral glide restriction due to swelling).",
      "Neurologic": "Sensation intact LLE. No numbness/tingling. Reflexes 2+ patellar and Achilles.",
      "FunctionalTests": {
        "SingleLegBalance": "Left: 10 seconds with some wobble; Right: 30+ seconds stable.",
        "SquatTest": "Unable to perform full one-legged squat on left due to pain/instability; two-legged squat to 60° knee flexion is possible with mild pain.",
        "StepDownTest": "Left: exhibits poor knee control (medial collapse) and pain stepping down 8-inch step."
      }
    },
    "Assessment": {
      "Diagnosis": "Tear of medial meniscus, left knee (ICD-10: S83.241A). Post-traumatic knee weakness and instability.",
      "ClinicalImpression": "17-year-old athletic patient with left medial meniscus tear resulting in pain, mild effusion, quadriceps inhibition, and feelings of instability. Ligaments are intact (no ACL injury). Deficits noted in left knee ROM (slight extension loss), quadriceps strength, balance, and dynamic knee control (valgus tendency). Good potential for recovery with conservative management. Prognosis: Fair to good. If patient adheres to therapy, likely to return to sport; will monitor for any locking or worsening that might indicate need for surgical intervention. At this time, non-operative rehab is appropriate. Will also address neuromuscular control to prevent re-injury."
    },
    "Plan": {
      "TreatmentPlan": "Initiate PT 2x/week for 8 weeks focusing on knee stabilization, ROM, and strength. Begin with reducing pain/swelling: RICE, gentle range-of-motion exercises (heel slides, bike with no resistance), patellar mobilizations. Progressive therapeutic exercise program: closed-chain strengthening (wall sits, leg press partial range) to improve quad without aggravating meniscus, open-chain quad extensions limited arc (0-45° initially to avoid excessive meniscus stress), hamstring strengthening. Neuromuscular re-education for dynamic stability: balance training on unstable surfaces (balance board, single-leg stands), neuromuscular electrical stimulation (NMES) to left quad if needed for activation. Gait and agility: practice proper cutting mechanics and increase running gradually in later stages. Manual therapy: soft tissue mobilization for quad/IT band, joint mobilization for extension (posterior tibial glide if needed to regain full extension). Modalities: ice after sessions for swelling, consider ultrasound around medial joint line if persistent pain. Home exercise program to include quad sets, straight leg raises, and mini-squats, progressing as tolerated. Will communicate with referring MD about progress; if no improvement or if knee locks, recommend follow-up with orthopedist.",
      "ShortTermGoals": [
        "Eliminate knee effusion and achieve full knee extension (0°) in 2 weeks.",
        "Increase left quadriceps strength from 4-/5 to 4+/5 in 4 weeks (measured via single-leg squat depth and manual test).",
        "Improve single-leg balance on left to 30 seconds without wobble in 4 weeks."
      ],
      "LongTermGoals": [
        "Return to pain-free full range of motion in left knee (0–135°) in 6-8 weeks.",
        "Restore left lower extremity strength to 5/5 and symmetric hop/squat performance in 8 weeks.",
        "Demonstrate proper knee mechanics (no valgus collapse) on sport-specific drills (cutting, jumping) in 8 weeks.",
        "Return to competitive soccer practice in 8 weeks and games by ~12 weeks, with clearance from MD."
      ],
      "FrequencyDuration": "2 sessions per week for 8 weeks (16 visits). Re-evaluate at week 4 and week 8 to assess progress. Will request authorization extension if needed based on status."
    }
  },
  "maria-garcia": {
    "PatientID": "PT-003",
    "Name": "Maria Garcia",
    "Age": 60,
    "Gender": "Female",
    "Occupation": "Retired (Former homemaker)",
    "InsuranceProvider": "Medi-Cal",
    "PlanStartDate": "2025-08-19",
    "Subjective": {
      "ChiefComplaint": "Chronic low back pain with recent increase in intensity, affecting mobility.",
      "HistoryOfPresentIllness": "Patient has a 10-year history of low back pain, related to degenerative disc disease (per past MRI showing L4-L5 disc bulge). Pain has worsened over past 3 months after an episode of lifting a heavy box at home. Reports constant dull ache in lower back (lumbar area) with intermittent sharp pains radiating slightly into right buttock (no below-knee radiation). No new numbness or weakness noted, but states balance feels off and she has stumbled a few times. Has not been to PT in several years. Primary care physician referred to PT to prevent decline and avoid possible need for surgery. Pain is limiting her in walking and household chores.",
      "PainLevel": "Baseline 5/10, up to 7/10 with prolonged standing or lifting. Better (3/10) when lying down.",
      "PainDescription": "Aching across low back, stiffness in the morning. Sharp twinge in right low back/hip area when bending forward or standing >10 minutes. Uses heating pad daily which helps somewhat.",
      "AggravatingFactors": "Bending forward, lifting anything >10 lbs, standing or walking >15 minutes, climbing stairs.",
      "EasingFactors": "Rest, heat, gentle stretching, changing positions frequently.",
      "AssistiveDevices": "Uses a single-point cane for long walks (for balance confidence). No brace.",
      "PastMedicalHistory": "Type 2 Diabetes, Hypertension, Obesity (BMI ~32). No surgeries on spine. Has mild diabetic peripheral neuropathy (feet numbness). No falls, but feels unsteady at times.",
      "Medications": "Metformin, Atenolol, Gabapentin (for neuropathy), Acetaminophen as needed for back pain (takes daily).",
      "FunctionalStatus": "Lives alone, independent in self-care but slow. Cannot stand long enough to cook full meals - needs breaks. Limits shopping trips due to back pain and fatigue. Walks with short distances only; uses motorized cart in big stores. No longer participates in church activities that require standing or walking. Reports difficulty getting out of low chairs or bathtub due to back and leg weakness.",
      "PatientGoals": "Decrease back pain to allow her to walk in her neighborhood at least 30 minutes and do household chores (like cooking, light cleaning) without frequent breaks. Improve balance to reduce fear of falling. Wants to be able to attend her granddaughter's events which require walking and standing."
    },
    "Objective": {
      "Posture": "In standing: increased lumbar lordosis and protuberant abdomen, slight forward head. In sitting: tends to slouch, posterior pelvic tilt.",
      "Gait": "Antalgic components: slightly shortened stride length, especially on right. Uses cane occasionally. Balance is mildly impaired on uneven ground (per patient report).",
      "LumbarAROM": {
        "Flexion": "50% of expected range (fingertips to knees); reproduces pain 7/10 in low back at end-range.",
        "Extension": "25% of expected range (very limited, pain 5/10).",
        "SideBend": "Right: 50% with pulling sensation right low back; Left: 75% with mild discomfort."
      },
      "HipROM": "Within functional limits, mild limitation in right hip internal rotation (20°) with stiffness.",
      "Strength": {
        "TrunkFlexors": "4/5 (core weakness)",
        "TrunkExtensors": "4/5",
        "HipExtensors": "Right 4/5, Left 4+/5",
        "HipAbductors": "Right 4-/5, Left 4/5",
        "KneeExtensors": "Right 4/5, Left 4/5",
        "AnklePlantarflexors": "5/5 bilaterally"
      },
      "Neurologic": "Light touch slightly decreased in feet (worse on right, due to diabetic neuropathy). Reflexes: 1+ Achilles bilaterally, 2+ patella. No acute radicular signs; negative straight leg raise. Balance: Romberg test mildly positive (sway present, eyes closed).",
      "SpecialTests": {
        "SLR": "Negative for radicular pain (tight hamstrings noted).",
        "FABER": "Bilateral positive for low back/glute discomfort (likely SI/lumbar contribution, not true hip joint issue).",
        "ThomasTest": "Mild tightness in right hip flexor (leg not completely flat on table)."
      },
      "FunctionalAssessment": {
        "TimedUpAndGo": "16 seconds (using cane). Slightly above fall-risk threshold for her age (normal ~<12s).",
        "BergBalanceSubset": "Difficulty noted with single-leg stance (unable to maintain >3 seconds), and tandem stance (needed support).",
        "5RepSitToStand": "Took 20 seconds, used arms to assist (indicates leg and core weakness)."
      }
    },
    "Assessment": {
      "Diagnosis": "Chronic low back pain with lumbosacral spondylosis (ICD-10: M47.816) and deconditioning. Impaired balance and functional mobility.",
      "ClinicalImpression": "60-year-old female with chronic mechanical low back pain, now exacerbated by decreased activity and core weakness. Contributing factors include poor core strength, limited lumbar mobility (especially extension), obesity increasing spinal load, and possibly tight hip flexors. Also presents with mild balance impairment likely due to a combination of deconditioning and peripheral neuropathy. Deficits in functional mobility (slow gait, difficulty rising from chair). She demonstrates fear of movement (fear-avoidance behavior) due to pain. Prognosis: Fair - improvements expected in pain and function with therapy, though chronic nature and comorbidities (diabetes, obesity) may limit full resolution. Goals will focus on pain management, improving strength/flexibility, and safety with mobility. Will coordinate care with PCP as needed (for pain management and any medical clearance for exercise)."
    },
    "Plan": {
      "TreatmentPlan": "Begin PT 2x/week for 12 weeks focusing on therapeutic exercise and functional training. Plan: **Pain Management/Modalities** – Use moist heat to lumbar region 10 min at start of sessions to reduce stiffness; incorporate TENS during sessions if needed for pain relief during exercise. **Therapeutic Exercises** – Core stabilization program (guided pelvic tilts, transverse abdominis activation, progressing to abdominal bracing, gentle lumbar stabilization exercises like dead bug or bird-dog modified as able). Stretching for lower back and hips (hamstring, hip flexor stretches) to improve flexibility. **Aquatic Therapy** – initiate exercises in warm water pool 1x/week if available to allow low-impact strengthening and conditioning (water walking, gentle pool exercises to improve endurance) – this will reduce weight-bearing stress and may increase her confidence. **Strength Training** – focus on gluteals, hip abductors, and quadriceps (sit-to-stand practice, step-ups, theraband side steps) to improve support for back and balance. Gradual progressive resistance as tolerated (start with isometrics and gravity exercises, progress to resistance bands). **Neuromuscular Re-education** – balance and proprioception exercises: static balance training (tandem stance, single-leg stance with support), progressing to dynamic balance (walking on foam, obstacle courses) to reduce fall risk. Gait training emphasizing upright posture and proper use of cane (ensure appropriate cane height and pattern). **Body Mechanics and Education** – Teach proper bending/lifting techniques (e.g. squat vs. stoop), pacing strategies for activities, ergonomics for home (e.g. raised toilet seat if needed, safe tub transfer techniques). Home exercise program will be provided (daily gentle stretching, activation exercises, walking schedule starting with 5-10 minutes and gradually increasing). Will also encourage weight loss through daily walking and refer to nutrition resources as appropriate. **Coordination of Care** – Ensure compliance with physician's plan; request updated prescription if more therapy needed beyond Medi-Cal limits and justify with functional gains. Plan to periodically reassess outcome measures (TUG, sit-to-stand) to track improvement.",
      "ShortTermGoals": [
        "Decrease reported low back pain from 5/10 to 3/10 with basic activities (walking, standing) in 4 weeks.",
        "Increase lumbar flexion range from 50% to 75% of normal (able to reach mid-shin) in 4-6 weeks with less pain.",
        "Improve Timed Up & Go to <12 seconds (fall risk cutoff for her age) in 6 weeks.",
        "Be able to rise from a chair independently without using arms in 6 weeks."
      ],
      "LongTermGoals": [
        "Patient to walk 30 minutes continuously on level surface with minimal pain (<=2/10) in 12 weeks.",
        "Demonstrate independent performance of a core stabilization routine and proper body mechanics for lifting light objects by 12 weeks.",
        "Improve lower extremity strength to 4+/5 and dynamic balance (e.g., safely negotiate community environments, curbs, uneven ground) in 12 weeks.",
        "Reduce fear of falling – patient to report increased confidence (e.g., improved Activities-specific Balance Confidence score) and have no falls through course of therapy."
      ],
      "FrequencyDuration": "2 times per week for 12 weeks (24 visits). Will request prior authorization as required by Medi-Cal for continuation beyond initial eval. Monthly progress notes will be sent to physician and Medi-Cal reviewer to justify ongoing care. Plan includes re-evaluation at 4 weeks and 8 weeks to update goals and ensure medical necessity is demonstrated."
    }
  }
};

export type PatientDataType = typeof patientData;
