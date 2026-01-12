import { Course, ExerciseType, UserProgress } from './types';

// *** COURSE CONTENT DATA (Localized) ***

const COURSE_EN: Course = {
  id: 'course_1_en',
  title: 'Introduction to Hermeticism',
  description: 'Master the fundamental principles of reality and self-responsibility.',
  units: [
    {
      id: 'unit_1',
      title: 'Mentalism & Correspondence',
      description: 'Understanding that the All is Mind and As Above, So Below.',
      order: 1,
      lessons: [
        {
          id: 'lesson_1_1',
          title: 'The Principle of Mentalism',
          description: 'The Universe is Mental.',
          requiredScorePercent: 75,
          introText: 'Before we can change anything in our lives, we must understand the nature of the container we live in.',
          quote: {
            text: "The All is Mind; The Universe is Mental.",
            source: "The Kybalion"
          },
          interpretation: "This does not mean the universe is 'imaginary' in a trivial sense. It means that the underlying substance of reality is consciousness. Just as you create a dream world with your mind, the Great Mind creates the universe. Your thoughts are seeds.",
          exercises: [
            {
              id: 'ex_1',
              type: ExerciseType.TRUE_FALSE,
              prompt: "Does 'The Universe is Mental' mean that physical objects do not exist?",
              options: ["True", "False"],
              correctAnswer: false,
              explanation: "Physical objects exist, but their *essence* and origin are mental in nature. They are manifestations of the Universal Mind.",
              points: 10
            },
            {
              id: 'ex_2',
              type: ExerciseType.MULTIPLE_CHOICE,
              prompt: "If the Universe is Mental, what is the most powerful tool you possess?",
              options: ["Physical Strength", "Financial Wealth", "Thought/Focus", "Social Status"],
              correctAnswer: "Thought/Focus",
              explanation: "Since reality is mental, your ability to direct your thought (focus) is your primary tool for influencing your experience.",
              points: 10
            },
            {
              id: 'ex_3',
              type: ExerciseType.SCENARIO,
              prompt: "You are stuck in traffic and feel angry. Applying the Principle of Mentalism, what is the first responsible step?",
              options: [
                "Honk the horn to release energy.",
                "Accept that traffic is external and you are a victim.",
                "Observe your own mental state as the creator of the 'anger' experience.",
                "Call a friend to complain."
              ],
              correctAnswer: "Observe your own mental state as the creator of the 'anger' experience.",
              explanation: "Responsibility starts inside. The traffic is the event; the anger is your mental creation in response to it.",
              points: 15
            },
            {
              id: 'ex_4',
              type: ExerciseType.REFLECTION,
              prompt: "Describe a recent situation where your mindset determined the outcome more than the external events.",
              points: 20,
              explanation: "Reflecting on personal experience anchors the theory."
            }
          ]
        },
        {
          id: 'lesson_1_2',
          title: 'The Principle of Correspondence',
          description: 'As above, so below.',
          requiredScorePercent: 80,
          introText: 'Patterns repeat on all scales. To understand the huge, look at the small. To understand the small, look at the huge.',
          quote: {
            text: "As above, so below; as below, so above.",
            source: "The Kybalion"
          },
          interpretation: "This is the law of analogy. Your inner world (microcosm) reflects the outer world (macrocosm) and vice versa. If your room is messy, your mind is likely cluttered. If your mind is chaotic, your life events will feel chaotic.",
          exercises: [
            {
              id: 'ex_2_1',
              type: ExerciseType.SORTING,
              prompt: "Arrange the sequence of manifestation according to Correspondence (Inner to Outer).",
              options: ["Action", "Thought", "Result/Circumstance", "Emotion"],
              correctAnswer: ["Thought", "Emotion", "Action", "Result/Circumstance"],
              explanation: "It flows from the subtle (Thought) to the gross (Result).",
              points: 15
            },
            {
              id: 'ex_2_2',
              type: ExerciseType.CLOZE,
              prompt: "To change your outer circumstances, you must first change your _____.",
              options: ["job", "partner", "inner state", "location"],
              correctAnswer: "inner state",
              explanation: "The outer is a reflection of the inner. Change the projector, not the screen.",
              points: 10
            }
          ]
        },
        {
          id: 'lesson_1_3',
          title: 'Unit Review & Mastery',
          description: 'Integrate Mentalism and Correspondence.',
          requiredScorePercent: 90,
          introText: 'Let us weave these two threads together.',
          exercises: [
            {
              id: 'ex_3_1',
              type: ExerciseType.SCENARIO,
              prompt: "You want a promotion (Outer). Using Correspondence and Mentalism, what is the correct approach?",
              options: [
                "Demand it because you worked hard.",
                "Wait and hope someone notices.",
                "Align your mental attitude and work ethic (Inner) with the qualities of the role you want.",
              ],
              correctAnswer: "Align your mental attitude and work ethic (Inner) with the qualities of the role you want.",
              explanation: "Become the vibration of the thing you desire.",
              points: 20
            }
          ]
        }
      ]
    }
  ]
};

const COURSE_DE: Course = {
  id: 'course_1_de',
  title: 'Einführung in die Hermetik',
  description: 'Meistere die fundamentalen Prinzipien der Realität und der Eigenverantwortung.',
  units: [
    {
      id: 'unit_1',
      title: 'Mentalismus & Entsprechung',
      description: 'Verstehen, dass das All Geist ist und wie oben, so unten.',
      order: 1,
      lessons: [
        {
          id: 'lesson_1_1',
          title: 'Das Prinzip des Geistes',
          description: 'Das Universum ist geistig.',
          requiredScorePercent: 75,
          introText: 'Bevor wir irgendetwas in unserem Leben ändern können, müssen wir die Natur des Behälters verstehen, in dem wir leben.',
          quote: {
            text: "Das All ist Geist; das Universum ist geistig.",
            source: "Das Kybalion"
          },
          interpretation: "Das bedeutet nicht, dass das Universum 'imaginär' in einem trivialen Sinne ist. Es bedeutet, dass die zugrunde liegende Substanz der Realität Bewusstsein ist. Genauso wie du eine Traumwelt mit deinem Geist erschaffst, erschafft der Große Geist das Universum. Deine Gedanken sind Samen.",
          exercises: [
            {
              id: 'ex_1',
              type: ExerciseType.TRUE_FALSE,
              prompt: "Bedeutet 'Das Universum ist geistig', dass physische Objekte nicht existieren?",
              options: ["Wahr", "Falsch"],
              correctAnswer: false,
              explanation: "Physische Objekte existieren, aber ihre *Essenz* und ihr Ursprung sind geistiger Natur. Sie sind Manifestationen des Universellen Geistes.",
              points: 10
            },
            {
              id: 'ex_2',
              type: ExerciseType.MULTIPLE_CHOICE,
              prompt: "Wenn das Universum geistig ist, was ist das mächtigste Werkzeug, das du besitzt?",
              options: ["Körperliche Stärke", "Finanzieller Reichtum", "Gedanken/Fokus", "Sozialer Status"],
              correctAnswer: "Gedanken/Fokus",
              explanation: "Da die Realität geistig ist, ist deine Fähigkeit, deine Gedanken zu lenken (Fokus), dein primäres Werkzeug, um deine Erfahrung zu beeinflussen.",
              points: 10
            },
            {
              id: 'ex_3',
              type: ExerciseType.SCENARIO,
              prompt: "Du steckst im Stau und fühlst dich wütend. Unter Anwendung des Prinzips des Geistes, was ist der erste verantwortungsvolle Schritt?",
              options: [
                "Hupen, um Energie rauszulassen.",
                "Akzeptieren, dass der Verkehr äußerlich ist und du ein Opfer bist.",
                "Deinen eigenen Geisteszustand als Schöpfer der 'Wut'-Erfahrung beobachten.",
                "Einen Freund anrufen, um sich zu beschweren."
              ],
              correctAnswer: "Deinen eigenen Geisteszustand als Schöpfer der 'Wut'-Erfahrung beobachten.",
              explanation: "Verantwortung beginnt im Inneren. Der Verkehr ist das Ereignis; die Wut ist deine mentale Schöpfung als Reaktion darauf.",
              points: 15
            },
            {
              id: 'ex_4',
              type: ExerciseType.REFLECTION,
              prompt: "Beschreibe eine Situation aus der letzten Zeit, in der deine Einstellung das Ergebnis mehr bestimmt hat als die äußeren Ereignisse.",
              points: 20,
              explanation: "Die Reflexion über persönliche Erfahrungen verankert die Theorie."
            }
          ]
        },
        {
          id: 'lesson_1_2',
          title: 'Das Prinzip der Entsprechung',
          description: 'Wie oben, so unten.',
          requiredScorePercent: 80,
          introText: 'Muster wiederholen sich auf allen Skalen. Um das Große zu verstehen, schau auf das Kleine. Um das Kleine zu verstehen, schau auf das Große.',
          quote: {
            text: "Wie oben, so unten; wie unten, so oben.",
            source: "Das Kybalion"
          },
          interpretation: "Dies ist das Gesetz der Analogie. Deine innere Welt (Mikrokosmos) spiegelt die äußere Welt (Makrokosmos) wider und umgekehrt. Wenn dein Zimmer unordentlich ist, ist dein Geist wahrscheinlich überladen. Wenn dein Geist chaotisch ist, werden sich deine Lebensereignisse chaotisch anfühlen.",
          exercises: [
            {
              id: 'ex_2_1',
              type: ExerciseType.SORTING,
              prompt: "Ordne die Sequenz der Manifestation nach dem Prinzip der Entsprechung (Innen nach Außen).",
              options: ["Handlung", "Gedanke", "Ergebnis/Umstand", "Emotion"],
              correctAnswer: ["Gedanke", "Emotion", "Handlung", "Ergebnis/Umstand"],
              explanation: "Es fließt vom Feinstofflichen (Gedanke) zum Grobstofflichen (Ergebnis).",
              points: 15
            },
            {
              id: 'ex_2_2',
              type: ExerciseType.CLOZE,
              prompt: "Um deine äußeren Umstände zu ändern, musst du zuerst deinen _____ ändern.",
              options: ["Job", "Partner", "inneren Zustand", "Ort"],
              correctAnswer: "inneren Zustand",
              explanation: "Das Äußere ist eine Spiegelung des Inneren. Ändere den Projektor, nicht die Leinwand.",
              points: 10
            }
          ]
        },
        {
          id: 'lesson_1_3',
          title: 'Wiederholung & Meisterschaft',
          description: 'Mentalismus und Entsprechung integrieren.',
          requiredScorePercent: 90,
          introText: 'Lass uns diese beiden Fäden verweben.',
          exercises: [
            {
              id: 'ex_3_1',
              type: ExerciseType.SCENARIO,
              prompt: "Du willst eine Beförderung (Außen). Unter Nutzung von Entsprechung und Mentalismus, was ist der korrekte Ansatz?",
              options: [
                "Sie verlangen, weil du hart gearbeitet hast.",
                "Warten und hoffen, dass es jemand bemerkt.",
                "Deine innere Einstellung und Arbeitsmoral (Innen) mit den Qualitäten der Rolle in Einklang bringen.",
              ],
              correctAnswer: "Deine innere Einstellung und Arbeitsmoral (Innen) mit den Qualitäten der Rolle in Einklang bringen.",
              explanation: "Werde zur Schwingung dessen, was du begehrst.",
              points: 20
            }
          ]
        }
      ]
    }
  ]
};

export const COURSES = {
  en: COURSE_EN,
  de: COURSE_DE
};

// *** INITIAL USER STATE ***
export const INITIAL_USER_STATE: UserProgress = {
  language: 'de', // Default to DE as per user context
  theme: 'light',
  hearts: 5,
  maxHearts: 5,
  streak: 0,
  xp: 0,
  gems: 0,
  lastActiveDate: null,
  completedLessons: {},
  unlockedUnits: ['unit_1'],
  currentUnitId: 'unit_1',
  currentLessonId: 'lesson_1_1',
  memoryNotes: [],
  practiceStats: {},
  outcomeHistory: [],
  lastDailyCompletedDate: null,
  activeGate: null
};