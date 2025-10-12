"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import HistorySidebar from "../../components/HistorySidebar";

interface CaseHistory {
  id: string;
  name: string;
  timestamp: number;
  caseData: any;
}

interface Suggestion {
  id: string;
  title: string;
  description: string;
  cptCodes: {
    code: string;
    description: string;
    notes: string;
  }[];
}

export default function BrainstormingSuggestions() {
  const router = useRouter();
  const [caseData, setCaseData] = useState<any>(null);
  const [userName, setUserName] = useState("");
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<Suggestion | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [isCaseDetailsExpanded, setIsCaseDetailsExpanded] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackContext, setFeedbackContext] = useState<{
    title: string;
    type: string;
  } | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<
    "good" | "needs-work" | null
  >(null);
  const [feedbackComments, setFeedbackComments] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [caseHistory, setCaseHistory] = useState<CaseHistory[]>([]);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    // Get case data from sessionStorage
    const storedData = sessionStorage.getItem("note-ninjas-case");
    if (storedData) {
      setCaseData(JSON.parse(storedData));
    } else {
      // Redirect back if no case data
      router.push("/note-ninjas");
    }

    // Get user data from sessionStorage
    const userAuth = sessionStorage.getItem("note-ninjas-user");
    if (userAuth) {
      try {
        const userData = JSON.parse(userAuth);
        setUserName(userData.name);
        setUserEmail(userData.email);

        // Load case history
        const historyKey = `note-ninjas-history-${userData.email}`;
        const storedHistory = localStorage.getItem(historyKey);
        if (storedHistory) {
          setCaseHistory(JSON.parse(storedHistory));
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, [router]);

  const handleSelectCase = (caseData: any) => {
    sessionStorage.setItem("note-ninjas-case", JSON.stringify(caseData));
    setCaseData(caseData);
    setIsSidebarOpen(false);
  };

  const suggestions: Suggestion[] = [
    {
      id: "manual-therapy",
      title: "Manual Therapy Techniques",
      description:
        "Posterior capsule mobilization and glenohumeral joint mobilizations can help restore shoulder mechanics. Focus on grade III posterior glides to increase internal rotation and address capsular restrictions. Cross-friction massage to supraspinatus tendon may help with tissue healing and pain reduction.",
      cptCodes: [
        {
          code: "97140",
          description: "Manual Therapy",
          notes:
            "Joint mobilizations and soft tissue techniques - 15 minute increments",
        },
      ],
    },
    {
      id: "progressive-strengthening",
      title: "Progressive Strengthening Protocol",
      description:
        "Advance from isometric holds to isotonic exercises using resistance bands. Start with pain-free arcs and gradually increase range. Include scapular stabilization exercises like wall slides and prone T's. Progress to functional overhead reaching patterns as tolerance improves.",
      cptCodes: [
        {
          code: "97110",
          description: "Therapeutic Exercise",
          notes: "Strengthening and ROM exercises - each 15 minute unit",
        },
      ],
    },
    {
      id: "neuromuscular-training",
      title: "Neuromuscular Re-education",
      description:
        "Proprioceptive training using unstable surfaces and closed-chain exercises. Focus on scapulohumeral rhythm retraining and postural awareness. Include rhythmic stabilization exercises and perturbation training to improve dynamic shoulder control and prevent re-injury.",
      cptCodes: [
        {
          code: "97112",
          description: "Neuromuscular Re-education",
          notes:
            "Balance, coordination, and movement pattern training - 15 minute increments",
        },
      ],
    },
    {
      id: "functional-activities",
      title: "Work-Specific Functional Training",
      description:
        "Simulate job-related overhead activities with proper biomechanics. Practice lifting techniques, reaching patterns, and sustained overhead positioning. Use weighted objects to replicate work demands while maintaining proper scapular control and avoiding impingement positions.",
      cptCodes: [
        {
          code: "97530",
          description: "Therapeutic Activities",
          notes: "Functional task-oriented training - 15 minute increments",
        },
      ],
    },
    {
      id: "modality-interventions",
      title: "Adjunctive Modality Options",
      description:
        "Consider ultrasound for thermal effects to improve tissue extensibility before stretching. Electrical stimulation can help with muscle re-education if weakness persists. Ice application post-exercise to manage any inflammatory response from increased activity levels.",
      cptCodes: [
        {
          code: "97035",
          description: "Ultrasound",
          notes:
            "Thermal or non-thermal ultrasound - constant attendance required",
        },
        {
          code: "97032",
          description: "Electrical Stimulation",
          notes:
            "Attended electrical stimulation for muscle re-education or pain management",
        },
      ],
    },
    {
      id: "home-program-advancement",
      title: "Advanced Home Exercise Program",
      description:
        "Develop a progressive home program with resistance band exercises, postural correction techniques, and self-mobilization strategies. Include pain monitoring guidelines and activity modification principles. Provide clear progression criteria for advancing exercise difficulty.",
      cptCodes: [
        {
          code: "97535",
          description: "Self-care/Home Management Training",
          notes:
            "Patient education and home program instruction - not always separately billable",
        },
      ],
    },
  ];

  const openModal = (suggestion: Suggestion) => {
    setSelectedSuggestion(suggestion);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedSuggestion(null);
  };

  const openExerciseModal = (exerciseName: string) => {
    setSelectedExercise(exerciseName);
    setShowExerciseModal(true);
  };

  const closeExerciseModal = () => {
    setShowExerciseModal(false);
    setSelectedExercise(null);
  };

  const openFeedbackModal = (title: string, type: string) => {
    setFeedbackContext({ title, type });
    setFeedbackRating(null);
    setFeedbackComments("");
    setShowFeedbackModal(true);
  };

  const closeFeedbackModal = () => {
    setShowFeedbackModal(false);
    setFeedbackContext(null);
    setFeedbackRating(null);
    setFeedbackComments("");
  };

  const submitFeedback = () => {
    // Here you would typically send feedback to your backend
    console.log("Feedback submitted:", {
      context: feedbackContext,
      rating: feedbackRating,
      comments: feedbackComments,
    });
    closeFeedbackModal();
    // Could show a success message here
  };

  // Helper function to capitalize exercise names properly
  const capitalizeExerciseName = (name: string) => {
    // Handle special cases and acronyms
    const specialCases: { [key: string]: string } = {
      "grade III posterior glides": "Grade III Posterior Glides",
      "Cross-friction massage": "Cross-Friction Massage",
      "wall slides": "Wall Slides",
      "prone T's": "Prone T's",
      "functional overhead reaching patterns":
        "Functional Overhead Reaching Patterns",
      "rhythmic stabilization exercises": "Rhythmic Stabilization Exercises",
      "perturbation training": "Perturbation Training",
      "closed-chain exercises": "Closed-Chain Exercises",
      "lifting techniques": "Lifting Techniques",
      "reaching patterns": "Reaching Patterns",
      "sustained overhead positioning": "Sustained Overhead Positioning",
      ultrasound: "Ultrasound",
      "Electrical stimulation": "Electrical Stimulation",
      "Ice application": "Ice Application",
      "resistance band exercises": "Resistance Band Exercises",
      "postural correction techniques": "Postural Correction Techniques",
      "self-mobilization strategies": "Self-Mobilization Strategies",
    };

    return (
      specialCases[name] ||
      name
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    );
  };

  // Exercise details database
  const exerciseDetails: {
    [key: string]: {
      description: string;
      cues: string[];
      documentation: string[];
      billingCodes: { code: string; description: string; notes: string }[];
    };
  } = {
    "grade III posterior glides": {
      description:
        "Patient positioned in supine with arm at 90° abduction. Therapist stabilizes scapula with one hand while applying posterior directed force to humeral head with mobilizing hand. Sustained stretch held for 30 seconds, repeated 3-5 times.",
      cues: [
        "Tactile: Apply firm pressure to the patient's scapula to maintain proper stabilization during the mobilization",
        "Verbal: 'Relax your shoulder and let me move it for you - this should feel like a gentle stretch'",
        "Tactile: Guide the patient's arm positioning by gently holding their elbow in the correct 90° position",
        "Visual: Use anatomical models to show the patient how the joint surfaces are moving during treatment",
        "Verbal: 'Breathe deeply and try to let your muscles relax as I perform this technique'",
      ],
      documentation: [
        "Pt received grade III posterior glides to R glenohumeral joint in supine position with arm at 90° abduction. Manual therapy techniques applied to address posterior capsule restrictions limiting shoulder flexion ROM. Pt tolerated intervention well with reported decrease in stiffness. Passive shoulder flexion improved from 135° to 145° post-treatment.",
        "Applied posterior glides to glenohumeral joint to improve capsular mobility and reduce impingement symptoms. Pt positioned supine with scapular stabilization provided throughout technique. Sustained mobilizations performed for 30-second intervals with good patient tolerance and immediate improvement in overhead reaching.",
      ],
      billingCodes: [
        {
          code: "97140",
          description: "Manual Therapy",
          notes: "Joint mobilization techniques - minimum 8 minutes required",
        },
      ],
    },
    "Cross-friction massage": {
      description:
        "Deep transverse friction massage applied perpendicular to supraspinatus tendon fibers. Patient positioned in slight shoulder extension and internal rotation to access tendon insertion. Apply firm pressure with fingertip or thumb for 8-15 minutes to promote tissue healing and break up adhesions.",
      cues: [
        "Tactile: Position the patient's arm by gently guiding their hand behind their back to expose the tendon",
        "Verbal: 'This may feel intense but should not be sharp or shooting pain - let me know if it becomes too uncomfortable'",
        "Tactile: Apply firm, consistent pressure perpendicular to the tendon fibers using thumb or fingertip",
        "Visual: Show the patient the location of their supraspinatus tendon using anatomical diagrams",
        "Verbal: 'I'm working on breaking up scar tissue to help your tendon heal properly'",
      ],
      documentation: [
        "Pt received cross-friction massage to R supraspinatus tendon insertion to address tendinopathy and promote tissue healing. Deep transverse friction applied perpendicular to fiber direction for 8 minutes. Pt reported mild discomfort during treatment with improved pain-free arc of motion from 90° to 110° post-intervention.",
        "Applied cross-friction massage techniques to supraspinatus tendon to reduce adhesions and improve tissue quality. Patient positioned with shoulder in slight extension and internal rotation for optimal tendon access. Technique well-tolerated with patient education provided on expected post-treatment soreness.",
      ],
      billingCodes: [
        {
          code: "97140",
          description: "Manual Therapy",
          notes:
            "Soft tissue mobilization techniques - minimum 8 minutes required",
        },
      ],
    },
    "wall slides": {
      description:
        "Patient stands with back against wall, arms in 'goal post' position with elbows and wrists touching wall. Slowly slide arms up the wall maintaining contact, then return to start position. Focus on scapular retraction and avoiding shoulder impingement.",
      cues: [
        "Tactile: Place hands on patient's scapulae to encourage retraction and proper positioning",
        "Visual: Use a mirror positioned to the side so patient can monitor their arm alignment during movement",
        "Verbal: 'Keep your elbows and wrists pressed against the wall as you slide up - imagine squeezing a pencil between your shoulder blades'",
        "Tactile: Apply gentle pressure to the patient's lower back to maintain proper spinal alignment",
        "Verbal: 'Only go as high as you can while keeping everything touching the wall - don't force the movement'",
      ],
      documentation: [
        "Pt performed wall slides for scapular stabilization and shoulder mobility. Completed 2 sets of 10 repetitions with verbal cues for proper scapular retraction. Demonstrated improved scapulohumeral rhythm with reduced compensatory movements. Pain-free ROM increased to 130° overhead reaching.",
        "Engaged in wall slide exercises focusing on posterior capsule stretching and scapular muscle activation. Pt required tactile cues at scapulae to maintain proper retraction throughout range. Progressive improvement noted in shoulder blade control and overhead functional mobility.",
      ],
      billingCodes: [
        {
          code: "97110",
          description: "Therapeutic Exercise",
          notes: "ROM and strengthening exercises - each 15 minute unit",
        },
      ],
    },
    "prone T's": {
      description:
        "Patient lies prone with arms extended out to sides forming a 'T' shape. Lift arms off table by squeezing shoulder blades together and engaging posterior deltoid and rhomboids. Hold for 2-3 seconds, then lower slowly. Start with 10-15 repetitions.",
      cues: [
        "Tactile: Place hands on patient's rhomboids to encourage proper muscle activation during the lift",
        "Verbal: 'Squeeze your shoulder blades together like you're trying to hold a pencil between them'",
        "Visual: Position a mirror at the head of the table so patient can see their shoulder blade movement",
        "Tactile: Apply light pressure to the patient's thoracic spine to encourage proper spinal alignment",
        "Verbal: 'Think about lifting your arms by pulling your shoulder blades down and back, not just lifting with your shoulders'",
      ],
      documentation: [
        "Pt completed prone T exercises for posterior deltoid and rhomboid strengthening. Performed 2 sets of 12 repetitions with focus on scapular retraction and proper form. Demonstrated improved posterior chain activation with reduced upper trap dominance. Progressed from bodyweight to 1 lb weights.",
        "Engaged in prone T strengthening exercises to address scapular dyskinesis and improve posterior shoulder stability. Patient required verbal cues for proper scapular initiation of movement. Notable improvement in muscle endurance and coordination throughout treatment session.",
      ],
      billingCodes: [
        {
          code: "97110",
          description: "Therapeutic Exercise",
          notes: "Strengthening and ROM exercises - each 15 minute unit",
        },
      ],
    },
    "functional overhead reaching patterns": {
      description:
        "Simulate real-world overhead activities like reaching for objects on high shelves, putting items away, or work-related tasks. Start with light objects and progress weight/height as tolerated. Focus on proper biomechanics and scapular control throughout movement.",
      cues: [
        "Visual: Demonstrate proper reaching technique showing how to step closer to reduce shoulder stress",
        "Verbal: 'Step under what you're reaching for and use your legs to help - don't just reach with your arm'",
        "Tactile: Guide the patient's torso positioning by placing hands on their hips to encourage proper alignment",
        "Verbal: 'Keep your shoulder blade pulled down and back as you reach up - avoid shrugging your shoulder'",
        "Visual: Use objects at varying heights to practice different reaching angles and distances",
      ],
      documentation: [
        "Pt practiced functional overhead reaching patterns simulating work-related activities. Completed reaching tasks at shoulder height progressing to full overhead with 2 lb objects. Demonstrated improved scapular control and reduced compensatory trunk movements. Able to sustain overhead positioning for 10 seconds without pain.",
        "Engaged in task-specific training focusing on overhead reaching mechanics for return to work activities. Patient practiced reaching patterns with progressive loading from 1-3 lbs. Educated on proper body mechanics and energy conservation techniques for sustained overhead work demands.",
      ],
      billingCodes: [
        {
          code: "97530",
          description: "Therapeutic Activities",
          notes: "Functional task-oriented training - 15 minute increments",
        },
        {
          code: "97110",
          description: "Therapeutic Exercise",
          notes:
            "Can be billed as exercise if focusing on ROM/strength components",
        },
      ],
    },
    "rhythmic stabilization exercises": {
      description:
        "Patient holds arm in specific position while therapist applies alternating resistance in multiple directions. Patient must maintain position against changing forces to improve neuromuscular control and joint stability. Typically performed at 90° shoulder abduction.",
      cues: [
        "Verbal: 'Hold your position steady - don't let me move your arm as I push and pull in different directions'",
        "Tactile: Apply gentle alternating pressure at the patient's wrist and elbow to challenge stability",
        "Verbal: 'Keep your shoulder blade set and your core engaged while I try to disturb your position'",
        "Visual: Have patient watch their arm position in a mirror to maintain proper alignment during perturbations",
        "Tactile: Provide stabilization at the patient's trunk if needed to isolate shoulder stability challenges",
      ],
      documentation: [
        "Pt performed rhythmic stabilization exercises at 90° shoulder abduction to improve glenohumeral stability and neuromuscular control. Applied multidirectional perturbations with patient maintaining position for 30-second intervals. Demonstrated improved joint stability with reduced excessive muscle co-contraction.",
        "Engaged in rhythmic stabilization training focusing on dynamic shoulder control and proprioceptive awareness. Patient challenged with alternating resistance patterns while maintaining arm position. Notable improvement in ability to respond to external perturbations without compensatory movements.",
      ],
      billingCodes: [
        {
          code: "97112",
          description: "Neuromuscular Re-education",
          notes:
            "Balance, coordination, and movement pattern training - 15 minute increments",
        },
      ],
    },
    "perturbation training": {
      description:
        "Unexpected external forces or surface changes applied to challenge balance, stability, and reactive responses. Can include unstable surfaces, external pushes/pulls, or sudden changes in support. Designed to improve automatic postural responses and dynamic stability.",
      cues: [
        "Verbal: 'Stay ready - I'm going to challenge your balance in different ways and you need to react quickly'",
        "Tactile: Apply unexpected gentle pushes at the patient's shoulders or hips to challenge postural responses",
        "Visual: Use visual distractors or targets that change to challenge dual-task performance during balance",
        "Verbal: 'Keep your feet active and ready to step if needed - don't be afraid to move to catch yourself'",
        "Tactile: Provide safety support at the patient's waist while allowing them to experience controlled instability",
      ],
      documentation: [
        "Pt participated in perturbation training on unstable surfaces to improve dynamic balance and fall prevention strategies. Applied multidirectional perturbations with focus on automatic postural responses. Demonstrated improved reaction time and appropriate stepping strategies with reduced fall risk.",
        "Engaged in balance perturbation exercises using foam surfaces and external challenges to enhance proprioceptive responses. Patient showed progressive improvement in maintaining center of mass control during unexpected disturbances. Educated on home safety and fall prevention strategies.",
      ],
      billingCodes: [
        {
          code: "97112",
          description: "Neuromuscular Re-education",
          notes: "Balance and coordination training - 15 minute increments",
        },
      ],
    },
    "closed-chain exercises": {
      description:
        "Exercises where the distal segment (hand/foot) is fixed against a stable surface. Examples include wall push-ups, planks, or weight-bearing activities. Promotes co-contraction, joint stability, and functional movement patterns through kinetic chain activation.",
      cues: [
        "Tactile: Place hands on patient's core to encourage abdominal engagement during closed-chain activities",
        "Verbal: 'Keep your whole body in a straight line from head to heels - don't let your hips sag or pike up'",
        "Visual: Position patient sideways to a mirror so they can monitor their body alignment during exercises",
        "Tactile: Apply gentle pressure to the patient's shoulder blades to encourage proper scapular positioning",
        "Verbal: 'Push through your whole hand, not just your fingertips - distribute the weight evenly'",
      ],
      documentation: [
        "Pt performed closed-chain strengthening exercises including wall push-ups and modified planks to improve shoulder stability and core strength. Completed 2 sets of 10 wall push-ups with focus on scapular control and proper alignment. Demonstrated improved neuromuscular control and joint stability.",
        "Engaged in closed-chain exercises progressing from wall to incline push-ups for functional strengthening. Patient showed improved co-contraction patterns and dynamic stability through kinetic chain. Educated on progression criteria and home exercise modifications.",
      ],
      billingCodes: [
        {
          code: "97110",
          description: "Therapeutic Exercise",
          notes: "Strengthening exercises - each 15 minute unit",
        },
        {
          code: "97112",
          description: "Neuromuscular Re-education",
          notes:
            "Can be billed as neuro re-ed if focusing on stability/coordination",
        },
      ],
    },
    "lifting techniques": {
      description:
        "Training proper body mechanics for lifting objects from various heights and positions. Emphasizes hip hinge patterns, core bracing, and maintaining neutral spine alignment. Progressive loading with attention to work-specific demands and lifting frequency.",
      cues: [
        "Verbal: 'Hinge at your hips like you're trying to touch the wall behind you with your bottom'",
        "Tactile: Place hands on patient's hips to guide proper hip hinge movement pattern",
        "Visual: Use a dowel rod along the patient's spine to maintain neutral alignment during lifting",
        "Verbal: 'Brace your core like someone is going to punch you in the stomach before you lift'",
        "Tactile: Apply gentle pressure to the patient's lower back to encourage proper spinal positioning",
      ],
      documentation: [
        "Pt received training in proper lifting mechanics with focus on hip hinge patterns and spinal protection. Practiced lifting 10-20 lb objects from floor to waist height with emphasis on core bracing and neutral spine. Demonstrated improved body mechanics with reduced lumbar flexion during lifting tasks.",
        "Engaged in work-specific lifting training simulating job demands. Patient practiced lifting techniques from various heights with progressive loading. Educated on frequency guidelines, proper warm-up, and recognition of fatigue to prevent re-injury during return to work activities.",
      ],
      billingCodes: [
        {
          code: "97530",
          description: "Therapeutic Activities",
          notes: "Functional task-oriented training - 15 minute increments",
        },
        {
          code: "97535",
          description: "Self-care/Home Management Training",
          notes: "Work-related activity training and education",
        },
      ],
    },
    "reaching patterns": {
      description:
        "Coordinated arm and trunk movements to access objects at various heights and distances. Focus on proper sequencing, scapular control, and energy-efficient movement strategies. Practice both single and bilateral reaching tasks with functional objects.",
      cues: [
        "Visual: Demonstrate how to step closer to the target to reduce shoulder stress and improve efficiency",
        "Verbal: 'Lead with your eyes, then your hand - look where you want to reach first'",
        "Tactile: Guide the patient's trunk rotation by placing hands on their hips during cross-body reaches",
        "Verbal: 'Use your whole body to reach, not just your arm - turn your feet and body toward your target'",
        "Visual: Use colored targets at different heights and angles to practice varied reaching patterns",
      ],
      documentation: [
        "Pt practiced functional reaching patterns at multiple planes and heights to simulate daily activities. Completed reaching tasks from sitting and standing with focus on proper sequencing and energy conservation. Demonstrated improved coordination with reduced compensatory trunk movements and increased reaching efficiency.",
        "Engaged in reaching pattern training with emphasis on scapulohumeral rhythm and postural control. Patient practiced bilateral and unilateral reaching tasks with progressive distances and heights. Notable improvement in movement quality and reduced fatigue during sustained reaching activities.",
      ],
      billingCodes: [
        {
          code: "97530",
          description: "Therapeutic Activities",
          notes: "Functional task-oriented training - 15 minute increments",
        },
      ],
    },
    "sustained overhead positioning": {
      description:
        "Maintaining arms in elevated positions for extended periods to build endurance for work or daily activities. Start with short durations (30 seconds) and progress time as tolerated. Focus on proper posture and breathing throughout sustained holds.",
      cues: [
        "Verbal: 'Keep breathing normally - don't hold your breath while holding your arms up'",
        "Tactile: Apply gentle pressure to the patient's core to encourage abdominal engagement during holds",
        "Visual: Use a timer visible to the patient so they can track their progress and build confidence",
        "Verbal: 'If you feel sharp pain, lower your arms immediately - muscle fatigue is okay, but not sharp pain'",
        "Tactile: Provide light support at the patient's elbows if needed to maintain proper positioning",
      ],
      documentation: [
        "Pt performed sustained overhead positioning exercises to build muscular endurance for work-related activities. Maintained bilateral arm elevation for 45 seconds with focus on postural control and breathing. Demonstrated improved tolerance with progression from 30 to 60 seconds over treatment session.",
        "Engaged in overhead endurance training simulating job-specific demands. Patient practiced sustained positioning with progressive duration increases. Educated on pacing strategies, rest breaks, and signs of overexertion to prevent symptom exacerbation during work activities.",
      ],
      billingCodes: [
        {
          code: "97110",
          description: "Therapeutic Exercise",
          notes: "Endurance training - each 15 minute unit",
        },
        {
          code: "97530",
          description: "Therapeutic Activities",
          notes:
            "Can be billed as therapeutic activities if simulating work tasks",
        },
      ],
    },
    ultrasound: {
      description:
        "Therapeutic ultrasound using sound waves to create thermal or non-thermal effects in tissues. Applied to promote tissue healing, reduce inflammation, and improve tissue extensibility. Typically applied for 5-10 minutes using circular motions over treatment area.",
      cues: [
        "Verbal: 'You should feel gentle warmth developing in the area - let me know if it gets too hot'",
        "Tactile: Apply appropriate pressure with the ultrasound head to maintain good skin contact throughout treatment",
        "Visual: Show the patient the ultrasound gel and explain how it helps conduct the sound waves",
        "Verbal: 'This treatment will help improve blood flow and healing in your injured tissues'",
        "Tactile: Move the ultrasound head in slow, overlapping circles to ensure even heat distribution",
      ],
      documentation: [
        "Pt received therapeutic ultrasound to R supraspinatus tendon at 1.0 W/cm² for 8 minutes to promote tissue healing and reduce inflammation. Treatment well-tolerated with patient reporting decreased stiffness and improved comfort. Applied prior to manual therapy techniques for enhanced tissue extensibility.",
        "Applied pulsed ultrasound to shoulder region for non-thermal effects and tissue healing promotion. Patient educated on treatment rationale and expected outcomes. Ultrasound used as adjunct to exercise therapy with good patient tolerance and no adverse reactions reported.",
      ],
      billingCodes: [
        {
          code: "97035",
          description: "Ultrasound",
          notes:
            "Thermal or non-thermal ultrasound - constant attendance required",
        },
      ],
    },
    "Electrical stimulation": {
      description:
        "Application of electrical current to stimulate muscle contractions, reduce pain, or promote healing. Can be used for muscle re-education, strengthening, or pain management. Parameters adjusted based on treatment goals and patient tolerance.",
      cues: [
        "Verbal: 'You'll feel a tingling sensation that will gradually increase to a comfortable muscle contraction'",
        "Visual: Show the patient how to adjust the intensity using the control dial if they need more or less stimulation",
        "Tactile: Place electrodes in optimal positions for targeted muscle activation or pain relief",
        "Verbal: 'The muscle should contract and relax rhythmically - let me know if it feels uncomfortable'",
        "Visual: Position patient where they can watch their muscle contracting to enhance motor learning",
      ],
      documentation: [
        "Pt received electrical stimulation to R deltoid muscle for muscle re-education and strengthening. Applied NMES at 50 Hz for 15 minutes with 10-second on/off cycles. Patient demonstrated improved voluntary muscle activation following treatment with enhanced shoulder abduction strength.",
        "Applied TENS unit for pain management to shoulder region with patient education on home use parameters. Electrical stimulation provided at comfortable sensory level for 20 minutes. Patient reported decreased pain from 6/10 to 3/10 following treatment session.",
      ],
      billingCodes: [
        {
          code: "97032",
          description: "Electrical Stimulation",
          notes:
            "Attended electrical stimulation for muscle re-education or pain management",
        },
      ],
    },
    "Ice application": {
      description:
        "Cryotherapy using ice packs, ice massage, or cold compression to reduce inflammation, pain, and muscle spasm. Applied for 15-20 minutes post-exercise or treatment to manage inflammatory response and provide pain relief.",
      cues: [
        "Verbal: 'The ice will feel very cold at first, then numb - this is normal and helps reduce inflammation'",
        "Tactile: Place a thin towel between the ice pack and skin to prevent ice burn while maintaining effectiveness",
        "Visual: Show the patient proper positioning to ensure the ice pack covers the entire treatment area",
        "Verbal: 'Keep the ice on for 15-20 minutes, then remove it for at least an hour before reapplying'",
        "Tactile: Check skin condition periodically during treatment to ensure no adverse skin reactions",
      ],
      documentation: [
        "Pt received ice application to R shoulder for 20 minutes post-exercise to manage inflammatory response and provide pain relief. Cryotherapy well-tolerated with patient reporting decreased pain and swelling. Educated on home ice application techniques and precautions.",
        "Applied cold pack to shoulder region following manual therapy and exercise interventions. Patient instructed on proper ice application duration and frequency for home use. Ice therapy used as part of comprehensive pain management strategy with good patient response.",
      ],
      billingCodes: [
        {
          code: "97010",
          description: "Hot/Cold Packs",
          notes: "Cryotherapy application - unattended modality",
        },
      ],
    },
    "resistance band exercises": {
      description:
        "Elastic resistance training using bands or tubing to provide variable resistance throughout range of motion. Allows for multi-planar strengthening and can be easily progressed by changing band tension, length, or exercise complexity.",
      cues: [
        "Tactile: Position the patient's grip on the band to ensure proper hand placement and control",
        "Verbal: 'Control the band on the way back - don't let it snap back quickly, make your muscles work in both directions'",
        "Visual: Demonstrate proper body positioning and alignment before the patient begins the exercise",
        "Verbal: 'Keep your core tight and maintain good posture throughout the entire movement'",
        "Tactile: Apply gentle pressure to the patient's shoulder blade to encourage proper scapular positioning",
      ],
      documentation: [
        "Pt performed resistance band exercises for shoulder strengthening including external rotation and abduction patterns. Completed 2 sets of 15 repetitions with yellow band resistance. Demonstrated improved scapular stability and muscle endurance with proper form throughout exercise session.",
        "Engaged in elastic resistance training focusing on rotator cuff strengthening and scapular stabilization. Patient progressed from red to green band resistance with maintained proper form. Provided home exercise program with band exercises and progression guidelines.",
      ],
      billingCodes: [
        {
          code: "97110",
          description: "Therapeutic Exercise",
          notes: "Strengthening and ROM exercises - each 15 minute unit",
        },
      ],
    },
    "postural correction techniques": {
      description:
        "Strategies and exercises to improve spinal alignment, head position, and overall postural awareness. Includes strengthening weak muscles, stretching tight structures, and education on ergonomic principles for daily activities.",
      cues: [
        "Visual: Use a mirror or posture grid to provide visual feedback on proper spinal alignment",
        "Verbal: 'Imagine a string pulling the top of your head toward the ceiling while your chin tucks back'",
        "Tactile: Place hands on the patient's shoulders to guide them into proper alignment",
        "Verbal: 'Think about lengthening your neck and lifting your chest without arching your back'",
        "Visual: Show before and after photos or use posture apps to demonstrate improvement over time",
      ],
      documentation: [
        "Pt received postural correction training with focus on cervical retraction and thoracic extension. Practiced proper sitting and standing alignment with mirror feedback. Demonstrated improved postural awareness with reduced forward head posture from 45° to 30° cervical angle.",
        "Engaged in comprehensive postural education including ergonomic assessment and corrective exercises. Patient learned chin tuck exercises and upper trap stretches for forward head posture correction. Provided workplace modifications and postural reminder strategies for long-term success.",
      ],
      billingCodes: [
        {
          code: "97110",
          description: "Therapeutic Exercise",
          notes: "Postural exercises and stretching - each 15 minute unit",
        },
        {
          code: "97535",
          description: "Self-care/Home Management Training",
          notes: "Ergonomic education and workplace modifications",
        },
      ],
    },
    "self-mobilization strategies": {
      description:
        "Patient-performed techniques to maintain joint mobility and tissue flexibility between therapy sessions. Includes self-stretching, foam rolling, and gentle joint mobilization techniques that patients can safely perform independently.",
      cues: [
        "Visual: Demonstrate the exact technique first, then have the patient practice while you provide feedback",
        "Verbal: 'Apply gentle, sustained pressure - this should feel like a good stretch, not painful'",
        "Tactile: Guide the patient's hand placement to ensure they're targeting the correct area",
        "Verbal: 'Hold each stretch for 30 seconds and breathe normally throughout the technique'",
        "Visual: Provide written instructions with pictures that the patient can reference at home",
      ],
      documentation: [
        "Pt instructed in self-mobilization techniques including doorway stretches and foam rolling for posterior capsule flexibility. Patient demonstrated proper technique with verbal and visual cues. Provided home program with frequency guidelines and progression criteria for independent management.",
        "Educated patient in self-treatment strategies including cross-friction massage and stretching techniques for ongoing symptom management. Patient able to locate tender points and apply appropriate pressure independently. Emphasized importance of consistency and proper technique for optimal outcomes.",
      ],
      billingCodes: [
        {
          code: "97535",
          description: "Self-care/Home Management Training",
          notes: "Patient education and home program instruction",
        },
      ],
    },
  };

  // Define exercises to make clickable in each section
  const exerciseMap: { [key: string]: string[] } = {
    "manual-therapy": ["grade III posterior glides", "Cross-friction massage"],
    "progressive-strengthening": [
      "wall slides",
      "prone T's",
      "functional overhead reaching patterns",
    ],
    "neuromuscular-training": [
      "rhythmic stabilization exercises",
      "perturbation training",
      "closed-chain exercises",
    ],
    "functional-activities": [
      "lifting techniques",
      "reaching patterns",
      "sustained overhead positioning",
    ],
    "modality-interventions": [
      "ultrasound",
      "Electrical stimulation",
      "Ice application",
    ],
    "home-program-advancement": [
      "resistance band exercises",
      "postural correction techniques",
      "self-mobilization strategies",
    ],
  };

  const renderDescriptionWithClickableExercises = (suggestion: Suggestion) => {
    let description = suggestion.description;
    const exercises = exerciseMap[suggestion.id] || [];

    // Replace exercise names with clickable spans
    exercises.forEach((exercise) => {
      const regex = new RegExp(
        `\\b${exercise.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
        "gi"
      );
      description = description.replace(
        regex,
        `<span class="exercise-link cursor-pointer text-purple-600 hover:text-purple-800 font-medium underline decoration-purple-300 hover:decoration-purple-500" data-exercise-name="${exercise}">${exercise}</span>`
      );
    });

    return description;
  };

  const handleExerciseClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains("exercise-link")) {
      e.stopPropagation();
      const exerciseName = target.getAttribute("data-exercise-name");
      if (exerciseName) {
        openExerciseModal(exerciseName);
      }
    }
  };

  if (!caseData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading suggestions...</div>
      </div>
    );
  }

  return (
    <>
      <HistorySidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        history={caseHistory}
        onSelect={handleSelectCase}
      />
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="bg-purple-50 rounded-lg shadow-sm p-4 mb-6 border border-purple-100">
            <div className="flex items-start justify-between mb-2">
              <button
                onClick={() => router.push("/note-ninjas")}
                className="text-gray-600 hover:text-gray-900 flex items-center text-sm"
              >
                <svg
                  className="w-4 h-4 mr-1"
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
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                <span className="text-2xl">🥷</span>
                <h1 className="text-2xl font-bold text-gray-900">
                  Note Ninjas App
                </h1>
              </div>
              <p className="text-gray-700 text-sm">
                The Brainstorming Partner for PTs and OTs
              </p>
            </div>
          </div>

          {/* Case Details - Collapsible */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Case Details
              </h2>
              <button
                onClick={() => setIsCaseDetailsExpanded(!isCaseDetailsExpanded)}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                aria-label={
                  isCaseDetailsExpanded
                    ? "Collapse case details"
                    : "Expand case details"
                }
              >
                <svg
                  className={`w-4 h-4 text-gray-600 transition-transform ${
                    isCaseDetailsExpanded ? "rotate-45" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </button>
            </div>

            {isCaseDetailsExpanded && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-4 pt-4 border-t border-gray-200">
                  <div>
                    <span className="font-medium text-gray-700">
                      Condition:
                    </span>
                    <p className="text-gray-600 mt-1">
                      {caseData.patientCondition}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      Desired Outcome:
                    </span>
                    <p className="text-gray-600 mt-1">
                      {caseData.desiredOutcome}
                    </p>
                  </div>
                  {caseData.treatmentProgression && (
                    <div className="md:col-span-2">
                      <span className="font-medium text-gray-700">
                        Treatment Progression:
                      </span>
                      <p className="text-gray-600 mt-1">
                        {caseData.treatmentProgression}
                      </p>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      // Prepare form data from case data
                      const formDataToSave = {
                        patientCondition: caseData.patientCondition || "",
                        desiredOutcome: caseData.desiredOutcome || "",
                        treatmentProgression:
                          caseData.treatmentProgression || "",
                        age: caseData.age || "",
                        gender: caseData.gender || "",
                        diagnosis: caseData.diagnosis || "",
                        comorbidities: caseData.comorbidities || "",
                        severity: caseData.severity || "",
                        dateOfOnset: caseData.dateOfOnset || "",
                        priorLevelOfFunction:
                          caseData.priorLevelOfFunction || "",
                        workLifeRequirements:
                          caseData.workLifeRequirements || "",
                      };

                      // Debug logging
                      console.log("Original caseData:", caseData);
                      console.log("Form data to save:", formDataToSave);

                      // Save to sessionStorage
                      sessionStorage.setItem(
                        "note-ninjas-form-data",
                        JSON.stringify(formDataToSave)
                      );
                      if (caseData.inputMode) {
                        sessionStorage.setItem(
                          "note-ninjas-input-mode",
                          caseData.inputMode
                        );
                      }

                      // Small delay to ensure storage is written
                      setTimeout(() => {
                        router.push("/note-ninjas");
                      }, 50);
                    }}
                    className="w-full px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex items-center justify-center gap-2 border border-purple-200"
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Create New Case from Details
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Treatment Approach Header */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 text-center">
              Recommended Starting Point & Progression
            </h3>
            <div className="w-16 h-1 bg-purple-500 mx-auto mt-2 mb-6"></div>
            <div className="max-w-3xl mx-auto">
              <p className="text-gray-700 text-base leading-relaxed">
                Based on your case, start with gentle range of motion exercises
                and pain-free strengthening. A typical progression begins with
                passive and active-assisted ROM, advances to active ROM with
                resistance band exercises, then progresses to functional
                overhead activities. Since progress has stalled, consider
                modifying exercise parameters (frequency, resistance, range) or
                introducing manual therapy to address underlying restrictions
                before advancing strengthening protocols.
              </p>
            </div>
          </div>

          {/* Techniques Section Title */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 text-center">
              Specific Techniques to Consider
            </h3>
            <div className="w-16 h-1 bg-purple-500 mx-auto mt-2 mb-6"></div>
          </div>

          {/* Suggestion Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-200 hover:border-purple-300"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {suggestion.title}
                </h3>
                <div
                  className="text-gray-600 text-sm leading-relaxed"
                  onClick={handleExerciseClick}
                  dangerouslySetInnerHTML={{
                    __html: renderDescriptionWithClickableExercises(suggestion),
                  }}
                />
              </div>
            ))}
          </div>

          {/* Exercise Modal */}
          {showExerciseModal && selectedExercise && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  {/* Modal Header */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-bold text-gray-900 capitalize">
                        {selectedExercise}
                      </h2>
                      <button
                        onClick={() =>
                          openFeedbackModal(
                            selectedExercise,
                            `${capitalizeExerciseName(
                              selectedExercise
                            )} Recommendation`
                          )
                        }
                        className="text-gray-400 hover:text-purple-600 transition-colors"
                        title="Provide feedback"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                          />
                        </svg>
                      </button>
                    </div>
                    <button
                      onClick={closeExerciseModal}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  {exerciseDetails[selectedExercise] ? (
                    <div className="space-y-6">
                      {/* Exercise Description */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                          Exercise
                        </h3>
                        <div className="flex items-start gap-3">
                          <p className="text-gray-700 leading-relaxed flex-1">
                            {exerciseDetails[selectedExercise].description}
                          </p>
                          <button
                            onClick={() =>
                              openFeedbackModal(
                                selectedExercise,
                                `${capitalizeExerciseName(
                                  selectedExercise
                                )} Exercise Description`
                              )
                            }
                            className="text-gray-400 hover:text-purple-600 transition-colors flex-shrink-0 mt-1"
                            title="Provide feedback"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Cues Section */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                          Cues
                        </h3>
                        <ul className="space-y-2">
                          {exerciseDetails[selectedExercise].cues.map(
                            (cue, index) => {
                              const cueType = cue.split(":")[0]; // Extract Tactile, Visual, or Verbal
                              return (
                                <li
                                  key={index}
                                  className="flex items-start gap-2"
                                >
                                  <span className="inline-block w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                                  <span className="text-gray-700 flex-1">
                                    {cue}
                                  </span>
                                  <button
                                    onClick={() =>
                                      openFeedbackModal(
                                        selectedExercise,
                                        `${cueType} Cue`
                                      )
                                    }
                                    className="text-gray-400 hover:text-purple-600 transition-colors flex-shrink-0 mt-1"
                                    title="Provide feedback"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                                      />
                                    </svg>
                                  </button>
                                </li>
                              );
                            }
                          )}
                        </ul>
                      </div>

                      {/* Documentation Examples */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                          Documentation
                        </h3>
                        <div className="space-y-4">
                          {exerciseDetails[selectedExercise].documentation.map(
                            (doc, index) => (
                              <div
                                key={index}
                                className="bg-gray-50 rounded-lg p-4"
                              >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <span className="text-sm font-medium text-purple-600">
                                    Example {index + 1}
                                  </span>
                                  <button
                                    onClick={() =>
                                      openFeedbackModal(
                                        selectedExercise,
                                        `Documentation Example ${index + 1}`
                                      )
                                    }
                                    className="text-gray-400 hover:text-purple-600 transition-colors flex-shrink-0"
                                    title="Provide feedback"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                                      />
                                    </svg>
                                  </button>
                                </div>
                                <p className="text-gray-700 text-sm leading-relaxed italic">
                                  "{doc}"
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      {/* Billing Codes */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                          Billing Codes
                        </h3>
                        <div className="space-y-3">
                          {exerciseDetails[selectedExercise].billingCodes.map(
                            (billing, index) => (
                              <div
                                key={index}
                                className="bg-green-50 rounded-lg p-4 border border-green-200"
                              >
                                <div className="flex items-start justify-between gap-3 mb-2">
                                  <div className="flex items-center gap-3">
                                    <span className="font-semibold text-green-800 text-lg">
                                      CPT {billing.code}
                                    </span>
                                    <span className="text-green-700 font-medium">
                                      {billing.description}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() =>
                                      openFeedbackModal(
                                        selectedExercise,
                                        `CPT Code ${billing.code}`
                                      )
                                    }
                                    className="text-gray-400 hover:text-purple-600 transition-colors flex-shrink-0"
                                    title="Provide feedback"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                                      />
                                    </svg>
                                  </button>
                                </div>
                                <p className="text-green-700 text-sm">
                                  {billing.notes}
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">
                        Exercise details not available for "{selectedExercise}"
                      </p>
                    </div>
                  )}

                  {/* Modal Footer */}
                  <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
                    <button
                      onClick={closeExerciseModal}
                      className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Feedback Modal */}
          {showFeedbackModal && feedbackContext && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
              <div className="bg-white rounded-lg max-w-lg w-full">
                <div className="p-6">
                  {/* Modal Header */}
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-1">
                        Feedback For:
                      </h2>
                      <p className="text-gray-700">{feedbackContext.type}</p>
                    </div>
                    <button
                      onClick={closeFeedbackModal}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Rating Section */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      How would you rate this?
                    </label>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setFeedbackRating("good")}
                        className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                          feedbackRating === "good"
                            ? "bg-green-100 border-green-500 text-green-800"
                            : "border-gray-300 text-gray-700 hover:bg-green-50 hover:border-green-400"
                        }`}
                      >
                        Good
                      </button>
                      <button
                        onClick={() => setFeedbackRating("needs-work")}
                        className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                          feedbackRating === "needs-work"
                            ? "bg-red-100 border-red-500 text-red-800"
                            : "border-gray-300 text-gray-700 hover:bg-red-50 hover:border-red-400"
                        }`}
                      >
                        Needs Work
                      </button>
                    </div>
                  </div>

                  {/* Comments Section */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Comments (Optional)
                    </label>
                    <textarea
                      value={feedbackComments}
                      onChange={(e) => setFeedbackComments(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      rows={4}
                      placeholder="Tell us more about why you've given this feedback"
                    />
                  </div>

                  {/* Footer Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={closeFeedbackModal}
                      className="flex-1 px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitFeedback}
                      disabled={!feedbackRating}
                      className="flex-1 px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Submit Feedback
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal */}
          {showModal && selectedSuggestion && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  {/* Modal Header */}
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedSuggestion.title}
                    </h2>
                    <button
                      onClick={closeModal}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Description */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Treatment Approach
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {selectedSuggestion.description}
                    </p>
                  </div>

                  {/* Billing Information */}
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      How to Bill
                    </h3>
                    <div className="space-y-4">
                      {selectedSuggestion.cptCodes.map((cpt, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-semibold text-gray-900">
                              CPT {cpt.code}
                            </span>
                            <span className="text-gray-700">
                              {cpt.description}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{cpt.notes}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
                    <button
                      onClick={closeModal}
                      className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
