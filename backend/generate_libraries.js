const fs = require("fs");
const path = require("path");

// ============================================================================
// Response Library Data Generator for CalmChain
// Generates exactly 200 distinct responses for Level 1, 200 for Level 2,
// and 200 for Level 3 (Total = 600 distinct reference responses).
// ============================================================================

// ----------------------------------------------------------------------------
// LEVEL 1: CALM SUPPORT (200 distinct responses)
// Everyday stress, mild pressure, greetings, study/work routines, wellness tips
// Tone: Warm, calm, practical suggestion, gentle follow-up question. Max < 200 words.
// ----------------------------------------------------------------------------
const L1_TEMPLATES = [
  // 1. Greetings & Warm Sanctuary Welcomes (15 items)
  {
    cat: "greetings",
    kw: ["hello", "hi", "hey", "good morning", "good evening", "howdy", "welcome"],
    items: [
      "Hello! 🌿 Welcome to CalmChain. I'm here to listen, offer a steady space, or explore a quick breath whenever you're ready. How are you feeling right now?",
      "Hi there! Welcome to your quiet sanctuary. Take a gentle breath and let your shoulders drop. What's on your mind today?",
      "Good day! It's so nice to connect with you. Whether today felt rushed or peaceful, you can unpack things at your own pace here. How has your day been so far?",
      "Hey! Welcome. This is a judgment-free space created just for your wellbeing. Would you like to share how you're feeling today, or explore a grounding tool?",
      "Hello and welcome 🌿 Take a slow breath and settle in. How is your heart and mind doing at this moment?",
      "Good morning! Wishing you a gentle start to your day. What is one small thing you're hoping to focus on or feel today?",
      "Good afternoon! I hope you've had a moment to pause and hydrate. What has been occupying your thoughts today?",
      "Good evening! As the day winds down, this is your space to exhale any tension you've been carrying. How are you feeling tonight?",
      "Hi friend! I'm really glad you stopped by today. How are your energy levels feeling right now?",
      "Welcome back to your calm corner 🌿 No expectations here. Would you like to chat about something specific, or just check in with yourself?",
      "Hello! Whatever kind of day you've had, you are welcome here just as you are. How are things feeling for you right now?",
      "Hi! It's always a good time to take a mindful pause. Take a deep breath in, and let it out slow. How can I support you today?",
      "Hey there! Thanks for dropping into CalmChain. What's the main feeling in your mind as you start this conversation?",
      "Hello! Glad you're here. Let's take today one step at a time. What would feel most comforting for you to talk through right now?",
      "Hi! Welcome. I'm your confidential wellness companion. How has your week been treating you so far?"
    ]
  },
  // 2. Exam, College & Academic Pressure (25 items)
  {
    cat: "academic_pressure",
    kw: ["exam", "test", "study", "college", "school", "midterm", "grades", "assignment", "deadline", "homework", "studying"],
    items: [
      "Exams can bring so much cognitive pressure. Remember that your worth isn't defined by a single test score. Have you taken a 5-minute break away from your screens lately?",
      "Studying for long stretches can exhaust your mental battery. Try breaking your syllabus into 25-minute Pomodoro blocks with a 5-minute stretch. What subject feels heaviest right now?",
      "When academic deadlines stack up, it's natural to feel scattered. Try writing down just top 2 priorities for today and ignore the rest for now. What is the very next task you need to complete?",
      "It sounds like college demands are weighing heavily on you. Taking a step back to breathe doesn't waste time; it restores focus. How many hours have you been studying today?",
      "Exam stress often triggers racing thoughts. Try taking three deep belly breaths and sipping a glass of water. Can you give yourself permission to step outside for fresh air for five minutes?",
      "When preparing for tests, our minds tend to jump to worst-case scenarios. Let's focus on what is within your control right this minute. Which chapter or topic are you working on?",
      "School pressure is very real, but you don't have to carry the whole semester in one afternoon. Focus only on the page in front of you. Would you like to try a quick Box Breathing cycle first?",
      "If you're staring at notes and nothing is sinking in, that's your brain signaling fatigue. A 10-minute walk or a cool wash of your face can reset your cognitive rhythm. Shall we take a pause?",
      "Balancing assignments and life is tough. You've prepared and handled challenging days before, and you can handle this one too. What part of the syllabus is causing the most tension?",
      "Remember that retention happens during rest as much as study. Prioritizing at least 7 hours of sleep tonight will serve you better than late-night cramming. What time do you plan to sleep?",
      "When exam anxiety spikes, try writing down everything you're worried about on scrap paper to clear working memory. Would doing a quick brain dump help clear your head right now?",
      "It's completely okay if you didn't cover everything on your study schedule today. Consistent progress beats perfection. What is one topic you felt okay about today?",
      "College lectures and assignments can leave you feeling drained. Make sure you've eaten a nourishing snack today. When was the last time you had something to eat?",
      "Test nerves are common, but you have knowledge inside you that will show up when you need it. Let's slow your breathing down: in for 4, out for 4. How does your chest feel now?",
      "The pressure to perform can feel overwhelming. Remember to speak to yourself with the same kindness you'd offer a stressed classmate. What is one reassuring thing you can tell yourself?",
      "It is normal to feel nervous before big evaluations. Try focusing on the process rather than the outcome. What is the very first step you need to take tomorrow morning?",
      "Study burnout is real. If your mind is buzzing, stand up, stretch your arms overhead, and shake out your wrists. Does your body feel any lighter after moving a bit?",
      "When formulas or theories get tangled, explain them out loud to an imaginary listener or teddy bear. It activates different memory pathways. Would you like to try summarizing it here?",
      "Don't let one difficult practice test shake your confidence. Practice is for making mistakes and learning from them. Which question tripped you up the most?",
      "Academic deadlines feel relentless, but your health comes first. Take a conscious pause and drink a cup of warm tea or water. What's one relaxing thing you can do once your session ends?",
      "Feeling behind on homework can create a paralysis cycle. Pick the smallest, easiest 2-minute task just to build momentum. What is the simplest item on your to-do list?",
      "It's hard when college expectations feel so intense. Give yourself credit for showing up and putting in the effort. How can you be gentle with yourself this evening?",
      "When you feel anxious about future grades, bring your attention back to the present room. Look around and name three blue objects you see. Does that bring you a bit more into the present?",
      "You don't need to master everything in one single night. Consistent, moderate effort creates lasting learning. What topic would you like to review next?",
      "Academic challenges are stepping stones, not roadblocks. Trust yourself and your preparation. What is one thing you are proud of accomplishing this week?"
    ]
  },
  // 3. Work Pressure, Productivity & Routine (25 items)
  {
    cat: "work_pressure",
    kw: ["work", "job", "boss", "manager", "meeting", "office", "career", "coworker", "project", "deadline", "tasks", "workload", "burnout"],
    items: [
      "Work demands can easily follow you into your personal hours if boundaries blur. Have you set a clear cut-off time for your work laptop or emails today?",
      "When your inbox is overflowing, prioritize what truly moves the needle and let minor tasks wait. What is the single most important task on your plate right now?",
      "A tense conversation with a colleague or manager can stay on your mind for hours. Remind yourself that work is what you do, not who you are. How are you feeling after that interaction?",
      "Career expectations can feel heavy. Remember to celebrate small wins along the way. What is one small achievement from this week that you can acknowledge?",
      "Feeling overwhelmed by your workload is a signal to pause and renegotiate your capacity. Can any of these deadlines be reasonably extended?",
      "Work fatigue often stems from constant multitasking. Try focusing on just one document or task for the next 20 minutes with notifications muted. Would that feel manageable?",
      "It's easy to get frustrated when projects hit unexpected roadblocks. Step away from the keyboard for five minutes to clear your perspective. What part of the project is stuck?",
      "Long hours at a desk can build tension in your neck and spine. Roll your shoulders back three times and take a deep breath. Does your body feel a little less tight?",
      "Impatience with career growth is very natural, especially when you're working hard. Progress often compounds quietly before it's visible. What skill are you building right now?",
      "If meetings have drained your social battery today, give yourself permission for quiet evening downtime. What is your favorite way to unwind after work?",
      "When work stress builds up, writing a concise list of tomorrow's top three priorities helps you mentally clock out tonight. Have you tried closing your workday with a list?",
      "Performance pressure can make every email feel urgent. Most messages can wait until normal business hours tomorrow. What would help you disconnect this evening?",
      "You've navigated stressful work periods before and found a way through. Trust your resourcefulness. What is one helpful action you can take tomorrow?",
      "Feedback at work can sting, even when constructive. Give yourself time to process it without rushing to self-criticism. What was the core message of the feedback?",
      "Working through lunch or skipping breaks actually decreases afternoon focus. Step away to eat something balanced and rest your eyes. Have you taken a lunch break yet?",
      "A challenging day at work doesn't mean you're not capable. Everyone has days where tasks feel harder than usual. What can you take off your plate for the rest of today?",
      "If you're dealing with difficult workplace dynamics, focusing on what you can control — your response, your boundaries — protects your peace. What boundary might help here?",
      "The constant ping of notifications can keep your nervous system on high alert. Try putting your phone on 'Do Not Disturb' for 30 minutes. How does that sound?",
      "Remember that productivity fluctuates naturally throughout the week. Be proud of the effort you've put in today. How do you plan to reward yourself for getting through the day?",
      "Career decisions can trigger anxiety about the future. Focus on taking the next best step rather than figuring out the next ten years. What is one small step you can take today?",
      "Workplace frustration is valid, but carrying it home only drains you. Take three long exhalations as a symbolic transition from work to personal time. Shall we try that?",
      "If you're feeling underappreciated at work, remember your worth isn't dictated by other people's validation. You bring unique strengths. What is something you know you do well?",
      "When tasks feel insurmountable, ask yourself: 'What would this look like if it were simple?' How could you simplify your current task?",
      "Balance isn't something you find, it's something you create day by day. What is one non-work activity that brought you joy recently?",
      "Give yourself credit for managing complex responsibilities. You're doing the best you can with the resources available. How can you nurture yourself tonight?"
    ]
  },
  // 4. Mild Frustration & Daily Annoyances (20 items)
  {
    cat: "mild_frustration",
    kw: ["annoyed", "frustrated", "irritated", "bothered", "traffic", "mess", "spilled", "argument", "rude", "delayed"],
    items: [
      "Little daily frustrations can pile up until they feel much larger than they are. It's completely valid to feel irritated. What triggered this frustration for you?",
      "When minor things go wrong, our nervous system can react as if it's an emergency. Take one slow, grounding breath. Is this something that will matter a week from now?",
      "It is exhausting when people don't communicate clearly or plans get disrupted. Venting is healthy — let it out here safely. What do you wish the other person understood?",
      "Frustration often carries physical tension in the jaw or hands. Notice if you're clenching your teeth, and gently let your jaw relax. Does that release a bit of pressure?",
      "Daily annoyances like traffic, delays, or tech glitches test everyone's patience. Give yourself permission to feel annoyed without self-judgment. What's the main hassle right now?",
      "When irritation flares up, stepping away from the situation for two minutes can prevent regretful words. How would you like to handle this situation once you feel calmer?",
      "It feels unfair when you've done everything right and things still don't go smoothly. Your feelings make total sense. Would it help to distract yourself with music for a few minutes?",
      "Sometimes a quick change of physical environment — walking into another room or stepping outside — resets your mood. Can you step away for a brief moment?",
      "You don't have to force positivity when things are irritating. Acknowledging 'this is annoying' is often the fastest way to let the feeling pass. What's bothering you most?",
      "When someone is rude or inconsiderate, it usually reflects their inner turbulence, not yours. Don't let their bad day dictate your peace. What would help you shake it off?",
      "Frustration is energy looking for an outlet. Try scribbling on paper, squeezing a stress ball, or shaking your hands out. How does your body feel right now?",
      "Plans changing at the last minute is so frustrating when you were mentally prepared. Take a moment to adjust your expectations gently. What's an alternate plan you'd enjoy?",
      "Minor setbacks can feel like the straw that broke the camel's back if you were already tired. Are you running on low energy today?",
      "When things go sideways, remember that a bad hour doesn't mean a bad day. You can reset anytime. What's one nice thing you can do for yourself this afternoon?",
      "It's okay to roll your eyes, take a deep breath, and let the small stuff go. What's one thing going right for you today despite this annoyance?",
      "Feeling misunderstood or ignored naturally causes irritation. Expressing your boundary calmly when you're ready can help. What boundary would you like to set?",
      "Little hiccups happen to everyone. Be patient with the process and with yourself. How can you bring a little lightness into your day right now?",
      "When irritability sticks around, a glass of cold water or a quick splash on your face can break the sensory loop. Would you like to try that?",
      "You don't need to fix everything this second. Let the dust settle. What is something peaceful you can turn your attention toward?",
      "Give yourself grace for feeling annoyed. We're all human. How are you feeling in your body as you talk through this?"
    ]
  },
  // 5. Mild Sadness & Feeling Blue (20 items)
  {
    cat: "mild_sadness",
    kw: ["sad", "down", "blue", "unhappy", "melancholy", "gloomy", "heavy", "sigh", "low energy"],
    items: [
      "I'm sorry you're feeling down today. Sadness is a natural emotion that tells us we care deeply about something. What feels heaviest on your heart right now?",
      "Some days just feel gray and heavy without a clear reason, and that is okay. You don't have to force a smile here. Would you like some quiet company or a gentle distraction?",
      "When you're feeling blue, even small tasks can feel monumental. Give yourself permission to do the bare minimum today. What is one kind thing you can do for yourself?",
      "It takes courage to acknowledge sadness instead of brushing it away. I'm right here with you. Has something specific happened, or did this feeling arrive quietly?",
      "A warm beverage, a soft blanket, or gentle music can offer a tiny sanctuary when feelings are heavy. What usually brings you comfort when you're down?",
      "Remember that moods are like weather: cloudy skies are temporary, even when they linger for an afternoon. How long have you been feeling this heaviness?",
      "Crying or letting out a long sigh is the body's natural way of releasing emotional pressure. Let whatever you're feeling be here without judgment. How does your chest feel?",
      "You don't have to explain or justify your sadness to anyone. It is valid simply because you're experiencing it. What would feel most comforting to hear right now?",
      "When sadness weighs on you, reaching out to someone or just resting your eyes can help. What's one low-energy activity you enjoy?",
      "Sometimes sadness comes from unmet expectations or quiet disappointments. If there's something specific you were hoping for, I'm here to listen. Would you like to share?",
      "Be exceptionally gentle with your inner dialogue today. Treat yourself like a dear friend who needs a hug. What is something gentle you can say to yourself?",
      "Even on gray days, small moments of warmth exist — like sunlight through a window or a familiar song. Have you noticed any small comforts today?",
      "Low mood can make everything seem magnified. Take things hour by hour instead of looking at the whole week. What is your goal for the next hour?",
      "It is completely okay if all you did today was get through it. That is more than enough. How are your physical energy levels feeling?",
      "Sadness often needs expression rather than a quick fix. You can type as much or as little as you want here. What thoughts are echoing in your mind?",
      "Allow yourself to rest without guilt. Your body and mind might just be asking for recovery time. Can you rest a bit tonight?",
      "Remind yourself that this low feeling will not last forever. You will experience lightness and joy again. What is a happy memory that usually brings a smile?",
      "When spirits are low, spending 5 minutes looking at trees or sky outside can gently shift perspective. Is there a window nearby you could look out of?",
      "Honor your feelings today without rushing to judge them. You are allowed to have slower days. How can I best support you in this moment?",
      "Thank you for being open about feeling down. Sharing it takes vulnerability. What would bring a 1% improvement to your comfort right now?"
    ]
  },
  // 6. Mild Loneliness & Quiet Moments (20 items)
  {
    cat: "mild_loneliness",
    kw: ["lonely", "alone", "isolated", "quiet", "nobody", "ignored", "left out", "no friends"],
    items: [
      "Loneliness can feel very quiet and aching, but you are not alone in this space 💙 I'm right here with you. What does your loneliness feel like right now?",
      "It's possible to feel lonely even when surrounded by people if you feel unseen. Your presence matters and you are valued here. Who is one person you usually feel safe around?",
      "Quiet evenings can sometimes amplify feelings of isolation. Would it feel comforting to put on a podcast, a familiar show, or gentle music in the background?",
      "Loneliness is a universal human signal telling us we crave meaningful connection. It doesn't mean anything is wrong with you. What kind of connection are you longing for?",
      "Even a brief text to a friend or acquaintance — like sending a funny meme or asking how they are — can bridge the gap. Is there anyone you could send a quick hello to?",
      "When loneliness sets in, treat yourself as your own cherished companion. Make yourself a nice warm cup of tea or journal. What self-care activity feels accessible?",
      "You deserve connection that feels authentic and supportive. Remember that quality connections often take time to grow. What qualities do you value most in friendships?",
      "Sometimes visiting a public space like a park or coffee shop can provide gentle 'ambient community' without needing to interact. Would stepping out feel nice today?",
      "Being alone and feeling lonely are different; solitude can become a peaceful sanctuary when we soften our inner critic. How does this quiet moment feel to you?",
      "I'm here to chat whenever you want conversation or just a space to think out loud. What are some of your favorite hobbies or interests?",
      "It hurts when you feel left out of plans or conversations. Those feelings are real and understandable. What happened that made you feel this way?",
      "Remember that feelings of loneliness are temporary states, not permanent truths about your life. You have so many future connections waiting to happen. What gives you hope?",
      "If you're feeling isolated, volunteering or joining a local hobby group can be a gentle way to meet like-minded people. Have you ever considered community clubs?",
      "Give yourself extra warmth today. Wrap yourself in a cozy blanket and remind yourself of your worth. What is something you appreciate about your own personality?",
      "When no one seems around, pets, nature, and creative outlets can provide deep comfort. Do you have any pets or creative projects you enjoy?",
      "It takes courage to sit with quiet moments. You are enough, just as you are right now. How are you taking care of yourself today?",
      "Loneliness can make our thoughts feel louder than usual. What thoughts are popping up for you during this quiet time?",
      "Connecting with stories through reading or audiobooks can make the room feel warmer and full of company. Do you enjoy reading or listening to stories?",
      "Thank you for reaching out here. Sharing your solitude breaks the silence in a meaningful way. What would you like to explore together next?",
      "Even in quiet times, you are part of a larger world of people who feel the exact same way. What is one reassuring thought you can hold onto tonight?"
    ]
  },
  // 7. Everyday Overthinking & Decision Fatigue (20 items)
  {
    cat: "everyday_overthinking",
    kw: ["overthinking", "racing thoughts", "can't decide", "decision", "analyzing", "what if", "second guessing", "spiraling"],
    items: [
      "Overthinking is often the brain's attempt to control uncertain outcomes. Let's take a deep breath and pause the loop. What is the central 'what if' your mind is turning over?",
      "When thoughts are spinning in circles, writing them down on physical paper externalizes them and stops the loop. Have you tried writing down the core dilemma?",
      "Most decisions aren't permanent; they can be adjusted as you learn more. What is the simplest choice in front of you right now?",
      "If your mind is racing, try the 5-4-3-2-1 technique: notice 5 things you see, 4 you feel, 3 you hear, 2 you smell, and 1 breath. Shall we try grounding yourself in the room?",
      "Overanalyzing drains so much energy. Ask yourself: 'Will this matter in five years? Five months? Five weeks?' What does your gut instinct say?",
      "You don't need all the answers figured out today. You only need to know your next small step. What is that next step?",
      "When you catch yourself spiraling, say gently: 'Thank you mind, but I am safe right now in this chair.' How does your breathing feel right now?",
      "Perfectionism often drives overthinking because we're afraid of making a mistake. Remember that good enough is often great. What would a 'good enough' resolution look like?",
      "Decision fatigue is very real when you've had to make choices all day long. Give your mind a break and postpone non-urgent decisions until tomorrow. Can this wait until morning?",
      "Notice how overthinking tends to focus on worst-case scenarios. What is a realistic best-case or moderate-case scenario for this situation?",
      "Physical movement is an effective antidote to mental rumination. A brisk 10-minute walk can break the mental feedback loop. Can you take a short walk?",
      "Your brain is trying to protect you by analyzing every angle, but it's overworking. Acknowledge the effort and give it permission to rest. Does that resonate with you?",
      "Try setting a 5-minute 'worry timer'. Allow yourself to worry freely for 5 minutes, then deliberately switch to a comforting activity. Would you like to try that?",
      "When choices feel overwhelming, flip a coin — not necessarily to follow it, but to notice which outcome you secretly hope for while it's in the air. What does your heart lean toward?",
      "Racing thoughts thrive when we stay stationary. Shake out your arms, drink cold water, and stretch. How does your body feel now?",
      "Remember that rumination isn't problem-solving. True problem-solving is structured and leads to an action. What is one practical action you can actually take?",
      "Be gentle with yourself for overthinking. It usually happens to thoughtful, caring people. What is one thought you can let go of for tonight?",
      "You have made wise choices in the past, even when you felt uncertain. Trust your ability to adapt. What helped you decide in past situations?",
      "When doubts loop, bring your awareness to the soles of your feet touching the floor. Feel the solid ground beneath you. Are you feeling grounded?",
      "Give your mind permission to clock out for the night. The dilemma will still be there tomorrow, but you'll have fresher eyes. What will you do to wind down now?"
    ]
  },
  // 8. Sleep, Rest & Evening Wind-Down (15 items)
  {
    cat: "sleep_and_rest",
    kw: ["sleep", "insomnia", "bedtime", "tired", "exhausted", "night", "awake", "can't sleep", "restless"],
    items: [
      "Trouble sleeping is so frustrating when your body wants rest but your mind won't quiet down. Let's do a gentle wind-down: dim your lights and take long, slow breaths. Are your lights dimmed?",
      "If you've been tossing and turning in bed for more than 20 minutes, get up and sit in a dim room with a book or quiet music until sleepiness returns. Would that feel better than lying awake?",
      "Bedtime racing thoughts often mean unexpressed ideas from the day are looking for an exit. Keep a notebook by your bed to jot them down so your brain knows they won't be lost. Have you tried a brain dump?",
      "Try the 4-7-8 breathing technique: inhale for 4 seconds, hold for 7, and exhale with a whoosh for 8. It signals your nervous system to initiate sleep. Shall we try a round together?",
      "Looking at bright blue-light screens right before bed suppresses melatonin production. Try switching to an audio story, soft ambient rain sounds, or a guided sleep meditation. What sounds do you find relaxing?",
      "Release physical tension progressively: consciously unclench your jaw, lower your shoulders, uncurl your toes, and let your mattress support your entire weight. How does your body feel as you sink in?",
      "Don't worry about trying to 'force' sleep — sleep arrives when we stop trying. Focus simply on resting your muscles quietly. Does taking the pressure off feel a little lighter?",
      "A warm shower or hot chamomile tea about an hour before bed naturally cools down your core temperature and invites drowsiness. What is your favorite pre-sleep ritual?",
      "If tomorrow's to-do list is haunting your night, write it down on paper and physically close the notebook. Tell yourself: 'Tomorrow has its own place.' Can you put tomorrow on pause for tonight?",
      "Nighttime can make problems feel ten times bigger than they appear in daylight. Trust that things will look clearer and more manageable after morning light. Can you give yourself until morning?",
      "Resting quietly with your eyes closed still restores your physical energy, even if deep sleep takes a while to arrive. You are still resting. Does that reassure you?",
      "Check your sleep environment: is the room cool, dark, and quiet? Sometimes cracking a window for fresh cool air makes a significant difference. How is the temperature in your room?",
      "Heavy meals or caffeine late in the afternoon can keep the nervous system humming at night. Keep that in mind for tomorrow, and for tonight, focus on calm breaths. How is your breathing rhythm?",
      "Let go of watching the clock; checking the time only creates sleep anxiety. Turn your clock face away and focus on the feeling of soft blankets. Are you comfortable in your bed?",
      "Wishing you deep, restorative rest tonight. Allow your thoughts to drift like clouds without chasing them. Would you like a quiet soothing quote or silence to drift off?"
    ]
  },
  // 9. Breathing, Grounding & Sensory Exercises (20 items)
  {
    cat: "breathing_grounding",
    kw: ["breathing", "box breathing", "grounding", "deep breath", "relax", "meditate", "calm down", "sensory", "exercise"],
    items: [
      "Let's practice Box Breathing together: Inhale slowly for 4 seconds... Hold gently for 4... Exhale steadily for 4... And rest empty for 4. You can also open the animated Box Breathing tool in your sidebar. How did that breath feel?",
      "Here is a classic grounding practice called 5-4-3-2-1: Look around and identify 5 things you can see, 4 you can touch, 3 sounds you can hear, 2 scents, and 1 slow deep breath. What are 3 things you see right now?",
      "Deep breathing activates the vagus nerve and shifts your body from 'fight-or-flight' into 'rest-and-digest'. Put one hand on your chest and one on your belly, and let your belly expand on your inhale. Try three rounds now.",
      "Try physiological sighs: take two quick inhales through your nose, followed by one long, slow exhalation through your mouth. Doing this just twice immediately lowers heart rate. Would you like to try it?",
      "Grounding through your senses brings you out of mental storms. Feel the texture of your clothes or the surface under your palms right now. What does that surface feel like?",
      "Imagine roots growing from the soles of your feet into the earth, anchoring you firmly against any wind or worry. You are solid and supported. Can you feel that stability?",
      "When thoughts get loud, focus 100% of your attention on the cool air entering your nostrils and the warm air leaving your lips. Notice the temperature change for three breaths.",
      "Try a quick progressive muscle relaxation: gently tighten your shoulder muscles for 5 seconds, then deliberately release all tension at once. Notice the contrast of relaxation.",
      "Sip a glass of cool water very slowly, paying attention to the temperature, the swallow, and the sensation as it moves down. It's a wonderful physical reset. Do you have water nearby?",
      "Place both feet flat on the floor, push your toes down slightly, and feel the solid ground holding you up. The ground doesn't shake. You are safe here.",
      "Inhale peace and clarity for 4 counts, and exhale tension, stress, and noise for 6 counts. Making exhalations longer than inhales is key to physical calm. How does that feel?",
      "Trace the outline of your hand with the index finger of your other hand: inhale as you trace up a finger, exhale as you trace down. By the time you trace five fingers, you've taken five mindful breaths.",
      "Sound grounding: close your eyes for 30 seconds and listen for the farthest sound you can detect in the distance, then the nearest sound in the room. What did you hear?",
      "Allow your breathing to find its natural, unforced cadence. You don't need to do it 'perfectly'. Just let your breath happen naturally. Are your shoulders dropped?",
      "Sensory grounding with temperature: holding an ice cube or running warm water over your hands can instantly break acute stress cycles and bring you back to the present.",
      "Visualize your thoughts as leaves drifting down a gentle stream. You don't need to jump in and stop the leaves; just watch them float past from the grassy bank.",
      "Take a conscious breath and say internally: 'In this exact moment, I am okay.' Notice how this moment right now has no immediate threat. Can you feel that peace?",
      "Box Breathing is always available in your CalmChain sidebar whenever you need a visual guide. Inhale 4, Hold 4, Exhale 4, Hold 4. Would you like to do another round?",
      "Grounding in gratitude: think of one tiny, simple thing you're grateful for today — warm tea, a comfortable chair, or a kind word. What comes to mind?",
      "Well done for taking time to ground your body and mind. Consistent gentle pauses rewire your stress response over time. How does your body feel now compared to a few minutes ago?"
    ]
  },
  // 10. General Wellness, Curiosity & Self-Care (20 items)
  {
    cat: "general_wellness",
    kw: ["wellness", "self care", "routine", "habit", "nutrition", "water", "walk", "mental health", "happy", "grateful", "curious"],
    items: [
      "Mental wellness isn't about feeling positive all the time; it's about being compassionate with whatever you're experiencing. How are you treating yourself today?",
      "Small daily rituals create emotional anchors. Whether it's morning tea without your phone, a sunset walk, or journaling, consistency brings calm. What is your favorite ritual?",
      "Machine learning in CalmChain helps identify patterns in support levels and tailor responses without storing private conversational details or judging your journey. What aspect of AI interests you?",
      "Hydration and mood are closely linked: mild dehydration can increase cortisol and irritability. Have you had enough water to drink today?",
      "Getting 10 to 15 minutes of natural sunlight in the morning sets your circadian clock and boosts serotonin. Did you get any sunshine today?",
      "Expressing gratitude rewires neural pathways toward noticing what is working in your life. What are two things that went well for you today, however small?",
      "Self-care isn't selfish; it's essential maintenance. You cannot pour from an empty cup. What is one way you can refill your cup this evening?",
      "Movement is medicine for a busy mind. Even a 10-minute stretch or light walk changes your blood flow and energy. How has your physical activity been today?",
      "Setting boundaries with work, social media, and other people's demands protects your mental sanctuary. Is there a boundary you need to honor today?",
      "Curiosity is a wonderful antidote to anxiety. When you're curious about your feelings instead of afraid of them, they lose their power. What are your feelings teaching you today?",
      "Journaling is like having a quiet conversation with your soul. Writing unedited thoughts for 5 minutes clears mental clutter. Have you journaled recently?",
      "Surrounding yourself with calming sensory environments — soft lighting, pleasant scents, tidy spaces — reduces cognitive overload. How is your immediate surroundings feeling?",
      "Remember to celebrate your progress, not just the finish line. Every day you show up for yourself counts. What's a recent win you're proud of?",
      "Digital detox: taking even an hour away from social media feeds protects your peace of mind and reduces comparison fatigue. Would you consider an hour offline tonight?",
      "Listening to your body's signals is key: hunger, thirst, rest, movement. What is your body asking for most right at this moment?",
      "Kindness toward others also elevates your own mood. Doing one small secret act of kindness creates a ripple of warmth. Have you shared a kind word today?",
      "Wellness includes creative expression: drawing, cooking, playing music, or gardening. What creative activities do you enjoy?",
      "It is normal for motivation to ebb and flow. On low motivation days, rely on gentle habits and self-compassion rather than guilt. How is your motivation today?",
      "Your mental wellbeing is an ongoing journey with sunny peaks and cloudy valleys. Be patient with your process. How are you feeling right now?",
      "I'm honored to accompany you on your wellness journey today. Remember this sanctuary is always here whenever you need a mindful check-in. What's on your agenda next?"
    ]
  }
];

// ----------------------------------------------------------------------------
// LEVEL 2: ELEVATED SUPPORT (200 distinct responses)
// Persistent sadness, anxiety, burnout, relationship conflict, family stress,
// feeling overwhelmed, isolation, academic/career failure dread.
// Tone: Attentive, validating specific difficulty, gentle questions about immediate
// needs and safety, manageable next steps, trusted person/professional encouragement.
// ----------------------------------------------------------------------------
const L2_TEMPLATES = [
  // 1. Persistent Sadness & Deep Grief (25 items)
  {
    cat: "persistent_sadness",
    kw: ["crying", "empty", "grief", "heartbroken", "numb", "exhausted of feeling sad", "constant sadness", "hopeless", "lost"],
    items: [
      "I hear how heavy this sadness feels, and I want to validate how exhausting it is when sadness lingers day after day 💙 You don't have to carry this completely alone. Have you been able to share this with someone you trust?",
      "It is completely understandable that you feel drained when carrying this deep sadness. Crying is a natural and healthy release. What is one gentle thing your body needs right now — rest, water, or warmth?",
      "When sadness feels like a thick fog, even getting out of bed or taking a shower takes immense strength. I see the effort you are putting in just by being here. How has your sleep and eating been over the past few days?",
      "Persistent sadness can make you feel invisible and disconnected. I want you to know I am listening and your pain is real and valid. Would it feel okay to reach out to a close friend or a professional counselor for extra support?",
      "Carrying unspoken emotional pain wears down your emotional reserves. Let's take things one moment at a time. What part of this sadness feels most overwhelming right now?",
      "You don't need to have answers or 'fix' this sadness right this second. It's okay to just exist and let yourself rest. Is there a safe person in your life you could sit with today, even in silence?",
      "Grief and deep sadness often come in unpredictable waves. When a big wave hits, your only job is to stay afloat and breathe. Are you in a safe, comfortable spot right now?",
      "I hear the ache in your words. Please remember that reaching out for help is a sign of resilience, not weakness. Have you considered speaking with a mental health professional about how long this has lingered?",
      "When feelings feel so heavy, our internal dialogue can become harsh. Try to treat yourself with the same compassion you'd give a hurting friend. What would you say to someone you loved who felt this way?",
      "It sounds like you've been holding things together for too long without enough support. You are allowed to set down the weight. What is one responsibility you can let go of today?",
      "Emotional exhaustion is a physical reality — your nervous system needs recovery just like your muscles do. Can you give yourself permission to rest without guilt this evening?",
      "I'm here with you in this space. Take as much time as you need to express what hurts. What is the most painful thought running through your mind right now?",
      "When you're deeply hurting, the future can seem blurry and dark. Focus only on getting through today, or even just this afternoon. What is the next kind thing you can do for yourself?",
      "Feeling numb or disconnected is often your mind's way of protecting itself from overwhelming pain. It doesn't mean you will feel this way forever. What does your body feel like right now?",
      "I want to remind you that your life and your feelings matter deeply, even when everything feels drained of color. Have you spoken to a family member or doctor about these prolonged feelings?",
      "Sadness can feel so isolating, tricking us into thinking no one cares. But support is available and people do want to be there for you. Who is one person who has been kind to you in the past?",
      "It takes so much energy to mask sadness around others. In this sanctuary, you don't have to pretend. What would feel most comforting right now?",
      "I hear how much pain you've been carrying. Please remember to stay hydrated and eat even a small piece of toast or fruit. Have you eaten anything today?",
      "When sadness feels heavy in your chest, slow exhalations help release the physical constriction. Let's take one gentle breath together: in for 4, and out for 6. How does your chest feel now?",
      "Prolonged emotional distress deserves attentive care. If this weight has been present for weeks, scheduling a visit with a doctor or counselor could provide vital relief. How would you feel about exploring that?",
      "Thank you for trusting me with your raw feelings. It takes strength to say 'I am hurting.' What is one small comfort you can bring into your space right now?",
      "You don't have to walk through this dark valley alone. Whether it's a helpline, a trusted friend, or a counselor, reaching out can lighten the burden. Who could you contact today?",
      "Deep sadness often makes us retreat into isolation. Even stepping into the living room or sending one text to a friend can break the bubble. Could you send a quick text to someone you care about?",
      "I am holding space for you. Your feelings are not too much, and you are not a burden for feeling them. What do you need most in this moment?",
      "Please be gentle with yourself. You have survived difficult seasons before, and there is support to help you through this one too. How are you feeling right now?"
    ]
  },
  // 2. Intense Anxiety, Panic & Nervousness (25 items)
  {
    cat: "intense_anxiety",
    kw: ["anxiety", "panic", "can't breathe", "heart racing", "trembling", "terrified", "panic attack", "chest tight", "shaking", "scared"],
    items: [
      "I hear how intense your anxiety is right now, and I want to reassure you that you are safe in this moment 🌿 Panic feels terrifying, but it will pass. Put both feet flat on the floor and feel the ground supporting you. Can you feel the floor beneath your feet?",
      "When anxiety spikes, your body's alarm system is firing, but you are not in danger right now. Focus on a long, slow exhale. Let all the air leave your lungs slowly. What does your breathing feel like right now?",
      "Panic attacks are intense physical experiences — racing heart, dizziness, tight chest. Even though they feel dangerous, they are temporary and will settle down. Would you like to do a 4-second box breath together?",
      "I am right here with you. You are not going crazy, and you are not losing control. Look around the room and name three solid objects you can see. What do you see?",
      "When anxiety reaches a peak, sensory shock can help reset the nervous system: holding an ice cube, splashing cold water on your face, or drinking icy water. Do you have access to cold water nearby?",
      "Notice how your shoulders and chest might be tense. Consciously drop your shoulders down away from your ears and unclench your jaw. How does that feel?",
      "Anxiety feeds on 'what if' thoughts. Let's bring your attention back to 'what is'. Right now, in this room, you are breathing and you are safe. What is one physical sensation you notice right now?",
      "If you feel like you can't get a full breath, that is hyperventilation making your chest tight. Don't force a huge inhale — focus instead on a gentle inhale and a very long, quiet exhale through pursed lips. Try that twice.",
      "You have made it through every anxiety flare-up you've ever had in your life, and this one will pass too. You are stronger than this panic. How long has this wave been going on?",
      "It is okay if your hands are shaking or your heart is pounding. That is just adrenaline doing its job; it cannot harm you. Let's wait it out together gently. What is the room like around you?",
      "When anxiety feels unbearable, having a trusted person sit with you or talk on the phone can be deeply grounding. Is there someone nearby you can call or sit with?",
      "Try the 5-4-3-2-1 grounding technique right now: 5 things you see, 4 things you can physically touch, 3 sounds, 2 scents, 1 breath. What are 4 things you can reach out and touch right now?",
      "Give yourself permission to pause everything you were doing. The only priority right now is helping your body find its equilibrium. Can you sit back against your chair or bed?",
      "I hear how frightening these physical sensations are. Remember that panic peaks within 10 minutes and then naturally subsides as adrenaline metabolizes. Let's ride this wave together. How are you feeling now?",
      "Wrap your arms around yourself in a gentle hug, or place a weighted blanket on your lap. Deep pressure therapy helps signal safety to the brain. Do you have a blanket or jacket nearby?",
      "Anxiety often convinces us of catastrophic outcomes that almost never happen. Let's label the thought: 'This is just anxiety talking, not reality.' Does that bring a bit of separation?",
      "If you experience frequent panic attacks or intense daily anxiety, talking to a doctor or therapist can give you specialized tools and support. Have you ever spoken to a professional about panic?",
      "Take slow, gentle breaths into your lower belly. Imagine breathing into a balloon inside your stomach, then letting it deflate smoothly. Let's do two cycles.",
      "You are doing great just staying present with this conversation. Every minute you breathe through this, the wave recedes a bit more. What is your heart rate feeling like now?",
      "Remember: anxiety is an emotion, not a directive. You don't have to react to every alarm it sounds. What is one reassuring thought you can repeat to yourself right now?",
      "If you're at work, school, or a crowded place, it is completely okay to step into a quiet restroom or outside for fresh air. Can you find a quieter corner right now?",
      "Your nervous system is just trying to protect you, even if it's overreacting. Thank your body for trying to keep you safe, and tell it: 'We are safe right now.' Can you try saying that internally?",
      "Sip a warm drink slowly if cold water feels too intense. The repetitive action of swallowing helps regulate your vagus nerve. Would having some water help?",
      "I am staying right here with you until this wave settles. You are not alone in this panic. Tell me what your mind is telling you right now.",
      "Take another steady, grounding breath. You are surviving this moment, and you are going to be okay. How is your anxiety level on a scale from 1 to 10 right now?"
    ]
  },
  // 3. Deep Overwhelm & Mental Exhaustion (25 items)
  {
    cat: "deep_overwhelm",
    kw: ["overwhelmed", "too much", "drowning", "can't cope", "burnout", "exhausted", "breaking point", "shut down", "paralyzed"],
    items: [
      "I hear how completely overwhelmed you feel, like everything is piling up at once and there's no room to breathe 💙 When everything is 'too much', we have to stop trying to do it all. What is the single heaviest thing on your shoulders right now?",
      "Feeling like you're at a breaking point is your mind and body's way of demanding rest. You don't have to be superhuman. Can we take today off from high expectations and focus only on basic self-care?",
      "When overwhelm paralyzes you, even making a decision feels impossible. Let's take choices off the table. All you need to do right now is breathe and rest. Have you had anything to drink today?",
      "It sounds like you've been carrying the weight of the world for far too long. It is completely natural to feel exhausted and ready to shut down. What would it look like to give yourself a break today?",
      "When we're overwhelmed, our brains treat every problem as an immediate emergency. But 90% of tasks can wait. What is one deadline or chore that you can postpone without serious consequence?",
      "I hear how tired you are — not just physically, but deep in your spirit. Please know your feelings make complete sense given how much pressure you've been under. Who is in your corner that you can lean on?",
      "When everything feels like a crisis, pick the single smallest step: just drinking one glass of water or closing your eyes for 10 minutes. Can you do that tiny step with me right now?",
      "You don't have to carry everyone else's needs and emotions while neglecting your own. It is healthy and necessary to say 'I cannot handle this right now.' What boundary do you need to set?",
      "Cognitive overload is like having 50 browser tabs open in your brain until the system freezes. Close the tabs. What is one thought we can close and put away for today?",
      "I hear that you're near your limit. Please treat yourself with immense kindness right now. If someone you cared about felt this overwhelmed, what would you tell them to do?",
      "Burnout isn't solved in a single hour, but stopping the bleeding starts now. Step away from your desk, screens, or obligations for a brief window. Can you take a 15-minute breather?",
      "When you're drowning in responsibilities, asking for help isn't a failure — it's an act of wisdom. Is there a colleague, friend, or family member you can delegate something to?",
      "Your worth as a human being is not measured by your productivity or how much stress you can endure. You are valuable simply because you exist. How does hearing that feel?",
      "It's completely okay if all you can manage today is existing, breathing, and resting. Give yourself credit for holding on. What comfort can you wrap yourself in right now?",
      "Overwhelm often makes us feel hopeless about the future. But this extreme feeling is temporary; it's a symptom of acute exhaustion. How long have you felt this intense pressure?",
      "Let's break the paralysis cycle together: write down just three things on a paper, and hide everything else out of sight. Would that bring a little relief to your visual field?",
      "When your nervous system is in shutdown mode, gentle sensory comforts like warmth, silence, or soft blankets help restore equilibrium. Are you somewhere warm and comfortable?",
      "I hear the strain in your words, and I want to validate how real this struggle is. Please consider speaking with a counselor or doctor if this burnout has been chronic. Have you considered professional support?",
      "Take a long, deep breath and let your shoulders sink. You don't have to figure out the whole week today. What is the only thing that needs your attention for the next 30 minutes?",
      "Give yourself permission to say 'No' to new requests. Protecting your peace is non-negotiable when your tank is empty. What request can you decline today?",
      "It's okay to cry, scream into a pillow, or lay flat on the floor if you need to release pent-up emotional pressure. How would your body like to release this tension?",
      "You have carried so much for so long. It is okay to be tired. It is okay to rest. How can you be the gentlest with yourself for the rest of this day?",
      "Remember that asking for a pause or an extension is better than pushing yourself until you collapse. People are usually more understanding than we fear. Who could you ask for an extension?",
      "I'm right here with you. We don't have to solve your whole life right now; we just need to help you catch your breath. What would feel most soothing to your mind right this second?",
      "Take another gentle breath. You are doing the best you can under overwhelming circumstances. How does your chest and head feel right now?"
    ]
  },
  // 4. Relationship Breakdown & Heartbreak (25 items)
  {
    cat: "relationship_breakdown",
    kw: ["breakup", "broken heart", "partner", "ex", "cheated", "divorce", "relationship", "dumped", "miss them", "hurts so much"],
    items: [
      "Heartbreak causes real, measurable physical and emotional pain in our bodies 💙 I am so sorry you are going through this. It is completely natural to feel shattered. How long ago did this breakup happen?",
      "Losing a relationship is a form of profound grief — you are grieving not just the person, but the future and routines you shared. Allow yourself to mourn without apologizing for your tears. How are you holding up today?",
      "The urge to reach out or check on an ex can feel overwhelming, like withdrawal. Remind yourself that reaching out often reopens fresh wounds. What is something you can do right now to distract your hands and mind?",
      "I hear how deeply this hurts in your chest. The pain feels all-consuming now, but heartbreak does soften and heal with time and gentle care. Who is a friend or family member who can sit with you today?",
      "When a relationship ends, our self-worth can take a brutal hit. Remember: their inability to stay or choose you does not diminish your beauty, worth, or capacity to be loved. What do you appreciate about yourself?",
      "It's completely okay if you feel fine for an hour and then burst into tears the next. Healing is messy, non-linear, and gradual. How are your feelings shifting throughout the day?",
      "Going through old messages or photos will only keep your nervous system in acute pain. Can you put your phone in another room or ask a friend to hold onto it for a few hours? What would help you protect your peace?",
      "You don't have to understand all the 'whys' today. Sometimes closure is something you give yourself by accepting that the chapter has closed. Does that feel possible to consider?",
      "I hear how lonely the quiet moments feel without their texts or presence. In these moments, fill your space with gentle music, podcasts, or the company of loved ones. What comforting sounds can you put on?",
      "Treat yourself as someone recovering from an injury: eat warm, nourishing meals, stay hydrated, and rest as much as you can. Have you eaten anything nourishing today?",
      "It's normal to replay past arguments and wonder what you could have done differently. Be gentle with your past self; you did the best you could with what you knew then. Can you forgive yourself for past mistakes?",
      "Your life had meaning and joy before you met them, and it will have rich meaning and deep joy again. This is a painful transition, but not the end of your story. What brought you joy before this relationship?",
      "When someone betrays your trust, it is a reflection of their character and shortcomings, not yours. You deserved loyalty, honesty, and respect. How are you processing the anger and betrayal?",
      "Let the grief flow without fighting it. Crying releases endorphins and oxytocin, helping your body process the shock. Have you let yourself cry freely today?",
      "If you find yourself unable to function, eat, or sleep due to the grief of this breakup, speaking with a therapist can provide invaluable support and guidance. Have you considered talking to a counselor?",
      "Remind yourself: you deserve someone who chooses you enthusiastically, consistently, and without hesitation. Don't settle for breadcrumbs of affection. What do you truly deserve in a partnership?",
      "It's okay to feel angry. Anger is grief's bodyguard; it tells you that a boundary was crossed or that you deserved better. How is anger showing up for you?",
      "Surround yourself with people who remind you of who you are when you forget. Reach out to someone who loves you unconditionally. Who is someone in your life who truly supports you?",
      "Take things one morning, one afternoon, one evening at a time. Getting through each hour is a victory right now. What is your plan for the rest of tonight?",
      "Avoid making major life decisions while in acute heartbreak. Give yourself time for the emotional dust to settle before deciding anything big. Does taking time feel comforting?",
      "I am here to listen whenever you want to vent, reflect, or just cry. Your pain is safe here. What is the hardest thought you're facing today?",
      "Focus on the small acts of reclaiming your life: making your bed, wearing comfortable clothes, sipping tea. What is one small step you can take today for yourself?",
      "You are worthy of genuine, peaceful love. This heartbreak is a chapter of your journey, not your destination. How are you breathing right now?",
      "Write a letter expressing everything you feel — all the hurt, love, and frustration — and then safely burn or shred it without sending it. Would writing out your raw feelings help?",
      "Thank you for sharing this tender hurt with me. Please remember you are not alone in this grief. What comfort can you give yourself this evening?"
    ]
  },
  // 5. Family Strain, Domestic Friction & Expectations (20 items)
  {
    cat: "family_strain",
    kw: ["family", "parents", "mother", "father", "siblings", "fight with family", "toxic home", "disowned", "pressure from parents"],
    items: [
      "Family conflict can cut deeper than almost any other struggle because these are the people tied to our roots and identity 💙 It is completely exhausting to feel misunderstood at home. What happened recently?",
      "Living in a high-tension household keeps your nervous system constantly on guard. Your exhaustion is a natural response to that friction. Do you have a safe physical space or room where you can retreat?",
      "Remember that you can love your family while still recognizing that certain behaviors or expectations are unhealthy for you. Boundaries are an act of self-preservation. What boundary feels necessary right now?",
      "It is painful when parents or family members place unrealistic expectations on your life, career, or choices. You have the right to live your own authentic life. How are their expectations affecting you?",
      "When arguments at home become heated, stepping out for a walk or spending time at a library or friend's house can protect your peace. Can you step out of the house for a while today?",
      "You are not responsible for fixing your parents' emotions or marital problems. That is their responsibility, not yours to carry. Does that relieve a bit of the burden?",
      "Feeling like the 'black sheep' or the one who is always blamed is deeply lonely. Please know that your perspective is valid, and you deserve respect. How do you usually cope when home feels toxic?",
      "When family conversations turn into guilt trips, remind yourself internally: 'I am allowed to protect my mental health.' What do they often say that triggers your guilt?",
      "It's okay to mourn the family dynamic you wished you had while accepting the reality of the one you have. Acceptance doesn't mean agreeing; it means saving your energy. How does that sit with you?",
      "If you're dealing with constant criticism, build an internal sanctuary that their words cannot enter. Their criticism reflects their inner fears, not your worth. What is something you know to be true about yourself?",
      "Creating physical and emotional distance as an adult is sometimes the healthiest choice for long-term peace. Have you thought about what healthy distance looks like for your future?",
      "Arguments with siblings or parents can linger for days in your mind. Focus on what you can control: your calm tone, your response, and when you exit the room. What can you control right now?",
      "If home feels unsafe or emotionally volatile, reaching out to a local youth helpline or counselor can help you form a safety and exit plan. Do you feel physically safe in your home right now?",
      "You don't have to attend every argument you're invited to. Choosing not to engage is often the most powerful response. How would it feel to step away from the next debate?",
      "Validation shouldn't have to be fought for. If family isn't providing it, look to chosen friends and mentors who see and celebrate you for who you are. Who is in your chosen family?",
      "Family pressure around marriage, grades, or career can feel suffocating. Remember that at the end of the day, you are the one who has to live your life. What path do you truly want?",
      "Take a deep breath and let out any tension from that recent interaction. You are your own person, separate from your family's baggage. How does your body feel right now?",
      "Writing down your feelings in a private, password-protected journal can help untangle family gaslighting or confusion. Do you have a private place to write?",
      "Be proud of yourself for breaking generational patterns and seeking emotional health. It takes courage to choose calm over chaos. What pattern are you working to change?",
      "I'm here with you. Whatever happened at home, you have a safe space to breathe and regroup right here. What is your priority for feeling safe tonight?"
    ]
  },
  // 6. Academic / Career Failure Dread & Impostor Syndrome (20 items)
  {
    cat: "career_failure_dread",
    kw: ["failed", "rejection", "fired", "interview rejected", "impostor", "not smart enough", "hopeless future", "career ruined", "dropped out"],
    items: [
      "Experiencing a failure or major rejection is a heavy blow to your confidence 💙 It is completely natural to feel discouraged and scared about the future. What specific rejection or setback happened?",
      "A failed exam, lost job, or rejected interview is an event, not your identity. It describes a moment in time, not who you are as a capable human being. How are you treating yourself after this news?",
      "Rejection often feels like a closed door, but it is frequently a redirection toward something better aligned with your strengths. It's okay if that's hard to believe right now. What was the opportunity you were hoping for?",
      "Impostor syndrome tricks capable people into feeling like frauds who will be exposed. If you were invited into that room, program, or role, you earned your place. What evidence proves your competence?",
      "When a plan crumbles, the uncertainty of 'what next?' can trigger intense panic. Let's not map out the next five years today; let's just breathe and process the disappointment. How are your feelings showing up?",
      "Everyone who has ever accomplished meaningful things has a long list of silent rejections and failures behind them. You are in the messy middle of your story. What can this experience teach you once the sting fades?",
      "It is okay to be furious, sad, and disappointed right now. Don't rush to 'find the silver lining' before you've honored your grief. What do you feel most disappointed about?",
      "Your career or academic journey is a marathon with many alternate routes, detours, and scenic trails. One roadblock doesn't cancel the journey. Who is a mentor or friend you can discuss this with?",
      "When you receive harsh feedback or a rejection letter, step away from screens for a day before deciding your next move. Give your emotions time to settle. Can you step away for today?",
      "You are so much more than your resume, transcript, or job title. Your kindness, curiosity, resilience, and heart are what define you. What is something you value about yourself outside of work or school?",
      "Feeling like you've fallen behind your peers is a common trap of social comparison. Everyone's timeline is uniquely their own. Whose timeline are you comparing yourself against?",
      "Take a long, deep breath. You are still standing, you are still worthy, and your skills haven't vanished. What is one small, constructive action you can take when you feel ready?",
      "If you need to appeal a grade, request feedback on an interview, or explore alternate programs, you can do that with a clear head tomorrow. For tonight, focus on resting. Can this wait until morning?",
      "Failure stings because it means you dared to care and put yourself out there. Give yourself credit for having the bravery to try. What took courage in this attempt?",
      "If you're feeling chronic dread and inadequacy, speaking with a career counselor or mental health therapist can provide structured guidance and renewed perspective. Would you consider talking to someone?",
      "Remind yourself of past times when things seemed completely hopeless and you managed to find a way forward. What helped you get through a previous major setback?",
      "Don't let one panel of interviewers or one grading rubric determine your potential. Their assessment is limited; your potential is vast. What strengths do you have that weren't captured there?",
      "It's completely okay to take a couple of days to lick your wounds and rest. Be gentle with your mind and body. What comforting food or activity can you enjoy tonight?",
      "Reflect on what went wrong with curiosity rather than shame: 'What can I adjust for next time?' How does looking at it as an experiment feel?",
      "I believe in your ability to rebuild and find your footing again. Take this one day at a time. What is one kind thing you can do for yourself this evening?"
    ]
  },
  // 7. Chronic Isolation & Feeling Invisible (20 items)
  {
    cat: "chronic_isolation",
    kw: ["nobody cares", "invisible", "no one understands", "isolated for months", "detached", "alien", "unwanted"],
    items: [
      "I hear how painful and deeply exhausting chronic isolation feels 💙 When you feel invisible, it's easy to wonder if your presence even matters. I want to tell you clearly: you matter, and you are seen in this space right now. How long have you felt this disconnected?",
      "Living in isolation can create an echo chamber where negative thoughts sound like absolute truth. I am right here listening to you. What is the hardest part of feeling so disconnected?",
      "Feeling like an alien or like nobody understands you is an agonizing experience. But there are people in this world who share your wavelength and values, even if you haven't crossed paths yet. What kind of person do you feel understood by?",
      "When we feel unwanted, we often stop reaching out, which unintentionally deepens the isolation. Have you had any small interaction — even with a barista, neighbor, or online community — recently?",
      "Your life has intrinsic value that doesn't depend on how many people are currently around you. You are a complete human being. What are some of your favorite personal interests or passions?",
      "Chronic loneliness can make everyday tasks feel hollow. If you've been isolated for a long time, consider joining a structured group, class, or community volunteer project. Would that feel like something to explore?",
      "It takes immense courage to express that you feel forgotten. Thank you for speaking your truth here. What is something about yourself that you wish people took the time to see?",
      "Even in the deepest isolation, nature, books, and art can offer quiet companionship and connection to the human experience. Do you find comfort in nature or music?",
      "Please don't believe the lie that no one would notice if you were gone. You have a unique footprint in this world, and your story is still unfolding. Who is one person who has shown you warmth in the past?",
      "If social anxiety is keeping you isolated, please know that therapists specialize in gentle, step-by-step ways to rebuild social comfort without panic. Have you ever considered therapy for social anxiety?",
      "Take a gentle breath and feel your feet on the floor. You are physically here on this earth, breathing the same air as millions of others who also feel lonely tonight. Does that shared humanity offer any comfort?",
      "Start small: a friendly nod to someone on a walk, or a short comment in a hobby group. You don't need a huge circle; even one genuine connection changes everything. What is one small step you could take?",
      "Feeling disconnected can sometimes be a symptom of clinical depression. If this feeling has persisted for months, talking to a healthcare provider is an important step of self-care. Have you shared this with a doctor?",
      "Treat yourself with extra tenderness today. When the outside world feels cold, make your inside world warm and hospitable. What self-care can you give yourself tonight?",
      "I am holding space for you, and I won't turn away. You are not a burden, and your voice matters. What thoughts are weighing most heavily on you right now?",
      "Sometimes our minds tell us 'nobody cares' to protect us from the vulnerability of trying again. It's a defense mechanism, not reality. What if there are people who do care?",
      "Try visiting a library, botanical garden, or local market just to feel the gentle buzz of humanity without pressure to perform. How does that sound?",
      "You deserve friends who celebrate you and check in on you. The fact that you don't have that right now doesn't mean you never will. What qualities make you a good friend?",
      "Remember that seasons of deep isolation have visited many great thinkers, artists, and everyday people before leading to rich new connections. What hope can you hold onto for tomorrow?",
      "Thank you for being here with me today. You are not invisible, your words have been heard, and you are valued. How are you feeling right now?"
    ]
  },
  // 8. Repeated Hopelessness & Emotional Numbness (20 items)
  {
    cat: "repeated_hopelessness",
    kw: ["hopeless", "pointless", "why bother", "nothing changes", "stuck forever", "numb inside", "what's the point"],
    items: [
      "I hear how tired you are of feeling like nothing ever changes 💙 When hopelessness settles in, it drains all motivation and color from life. I want to sit with you in this space without demanding that you 'cheer up'. What feels most pointless right now?",
      "Hopelessness is often not a reflection of your reality, but a symptom of profound emotional exhaustion. When the brain is out of dopamine and energy, everything looks bleak. How long has this heaviness been clouding your vision?",
      "Feeling numb is your psyche's emergency brake when feelings become too overwhelming to process. It is a protective mechanism, but it feels scary. Can you feel any physical sensation in your body right now, like your hands or breath?",
      "When you say 'what's the point?', it tells me you've been trying so hard for so long without getting the relief you deserve. You deserve relief, and you deserve support. Have you shared how exhausted you are with a professional or doctor?",
      "I want you to know that depression lies: it tells you that the way things are right now is the way they will always be. That is not true. Seasons change, circumstances shift, and healing happens. Can you stay curious about the future?",
      "You don't need to believe in a grand future today; you just need to believe in making it through the next hour. What is one tiny, manageable thing you can do for yourself in the next hour?",
      "When everything feels hopeless, take the pressure completely off achievement, career, or expectations. Focus purely on survival, comfort, and basic health. Have you had water and food today?",
      "Please don't carry this heavy fog alone in the dark. Speaking with a therapist or counselor who understands chronic depression can provide new avenues of hope and practical treatment. Would you be open to seeking professional care?",
      "I hear the depth of your weariness. It takes so much courage to admit that you feel hopeless. What is one memory or thing in this world that used to bring you even a glimmer of warmth?",
      "You are allowed to feel tired. You are allowed to take a break from trying to fix everything. Rest your mind, close your eyes, and let yourself just exist. Can you give yourself permission to just rest?",
      "Hopelessness can trick you into thinking you are trapped, but there are always paths and resources you haven't discovered yet. Who is a professional or trusted person you could consult?",
      "Even when you can't feel hope yourself, you can borrow hope from others who believe in you and know that recovery is possible. I believe in your capacity to heal. How does hearing that feel?",
      "Notice if the thought 'nothing will ever change' is an absolute statement. Nothing in life remains completely static. What is one small thing that is different today compared to last year?",
      "When you're emotionally numb, small sensory experiences like washing your face with warm water or smelling a pleasant scent can gently anchor you. Would you try a sensory reset right now?",
      "Your life is precious, even in the middle of this dark, heavy valley. Please don't give up on yourself. Are you in a safe environment right now?",
      "I want to make sure you are safe while you carry this heavy feeling. Do you have thoughts of wanting to give up entirely, or are you just desperately exhausted and needing relief?",
      "If you ever feel that the hopelessness is pushing you toward unsafe thoughts, please know that 24/7 help is available immediately: you can call Tele-MANAS at 14416 or Emergency 112. Have you kept those resources handy?",
      "Be exceptionally gentle with your spirit. You are walking through heavy terrain, and every step you take is significant. How can you nurture yourself for the rest of tonight?",
      "Give yourself credit for continuing to show up, even when every step feels heavy. Your resilience is quiet, but it is real. What is one thing you need right now?",
      "Thank you for being completely honest with me about your pain. I am right here with you. What can we do together right now to bring 1% more comfort into your room?"
    ]
  },
  // 9. Manageable Next Steps & Professional Care Encouragement (20 items)
  {
    cat: "professional_care_next_steps",
    kw: ["need a therapist", "counselor", "doctor", "medicine", "next steps", "how to cope long term", "getting help"],
    items: [
      "Recognizing that your distress needs more support than everyday coping tips is a huge step of self-advocacy 💙 Professional therapists and counselors have evidence-based tools designed specifically for this. Have you ever worked with a counselor before?",
      "Therapy isn't about being 'broken'; it's about having a trained, compassionate guide who helps you unpack the heavy luggage you've been carrying. How would you feel about looking up local or online therapy options?",
      "When emotional distress persists for weeks and impacts sleep, appetite, or relationships, a consultation with a healthcare provider can rule out physical imbalances and open up new options. Would you consider talking to a doctor?",
      "Taking the first step toward getting help can feel intimidating, but you don't have to do it all at once. Even just bookmarking a clinic or asking a trusted friend for a recommendation is progress. What is one step that feels doable?",
      "In addition to therapy, building a daily safety and wellness plan — identifying your triggers, early warning signs, and go-to comforts — gives you structure when emotions flare up. Have you ever written a wellness plan?",
      "There are many affordable, accessible mental health resources available, including university counseling centers, tele-health platforms, and community clinics. What kind of support would feel most comfortable for you?",
      "Remember that finding the right therapist is like finding the right pair of shoes: it's okay to try a consultation and switch if the connection doesn't feel right. What qualities would you look for in a counselor?",
      "While we explore next steps, what is one manageable action you can take tonight to protect your peace and get some rest? Can you set a bedtime for tonight?",
      "Sharing your struggles with a trusted family member, mentor, or close friend can break the isolation and help you research professional support together. Who could you ask to help you look for care?",
      "You don't have to wait until you are in crisis to seek therapy; reaching out when you feel elevated stress is the most proactive gift you can give yourself. What has held you back from therapy in the past?",
      "Let's focus on manageable next steps: 1) Hydrate and eat a small meal, 2) Write down your core concerns on paper, 3) Schedule a doctor or therapy appointment. Does that sequence feel manageable?",
      "Therapists offer a confidential, judgment-free zone where you can say the things you can't say anywhere else. Having that release is profoundly healing. What is something you've never said out loud to anyone?",
      "If financial concerns are a barrier, many non-profits and public hospitals provide sliding-scale or free mental health services. In India, Tele-MANAS (14416) provides free 24/7 psychological support. Did you know about Tele-MANAS?",
      "Taking medication for mental health, if recommended by a psychiatrist, is no different than taking insulin for diabetes. It's a tool to balance brain chemistry so you can engage with life. What are your thoughts on medical care?",
      "You've shown so much courage by facing these feelings and talking through them today. Be proud of taking your mental health seriously. What is one positive takeaway from today?",
      "Small daily anchors help support professional care: regular sleep, morning light, nourishing food, and gentle movement. Which of these areas could use a little extra love right now?",
      "When looking for a counselor, look for specialists in CBT, ACT, or trauma-informed therapy depending on what you're navigating. What area feels like your main focus?",
      "You deserve to feel better, to laugh freely again, and to experience peace in your daily life. Professional support can help you get there. What does a peaceful life look like to you?",
      "Take things one day at a time as you explore resources. You don't have to overhaul your whole life overnight. What is your goal for tomorrow morning?",
      "I'm here to support you alongside any human resources and professional care you pursue. You are worthy of deep healing. How are you feeling right now as we talk about next steps?"
    ]
  }
];

// ----------------------------------------------------------------------------
// LEVEL 3: PRIORITY SUPPORT (200 distinct responses)
// Explicit self-harm or suicide intent, stated plan, immediate danger,
// inability to remain safe, urgent crisis intervention.
// Tone: Prioritize immediate safety over casual conversation, non-judgmental empathy,
// concise questions on immediate danger and staying safe, contact trusted person
// physically present, India emergency numbers (112, Tele-MANAS 14416), urgent professional help.
// No harmful instructions, no fake human counselor claim, no generic quotes. Max < 200 words.
// ----------------------------------------------------------------------------
const L3_TEMPLATES = [
  // 1. Immediate Crisis De-escalation & Safety Assessment (25 items)
  {
    cat: "immediate_safety_assessment",
    kw: ["suicide", "kill myself", "end my life", "want to die", "can't stay safe", "dying tonight", "crisis", "end it all"],
    items: [
      "I hear how much unbearable pain you are carrying right now, and I want you to know you are not alone 💙 Are you in immediate danger right now? Please connect with someone who can help keep you safe — call Tele-MANAS at 14416 (toll-free 24/7) or National Emergency 112 immediately.",
      "I hear how deep your agony is, but please stay with me. Your life has value, even when everything feels pitch black. Are you safe in this room right now? Can you promise me you will pause and call 14416 or 112 right now?",
      "I care about your safety above all else. If you are thinking of ending your life, please reach out for human help right now: call Tele-MANAS toll-free at 14416 or Emergency 112. Is there anyone physically nearby who can sit with you right now?",
      "Please don't carry this unbearable pain alone tonight. There are compassionate people waiting to listen and help you through this dark hour without judgment. Call 14416 (Tele-MANAS) or 112 right now. Can you keep yourself safe for the next ten minutes?",
      "I hear how completely exhausted and overwhelmed you are, but ending your life is a permanent step for a temporary storm. Are you in immediate physical danger? Please call 14416 or 112 immediately. Confidential resources are on your screen.",
      "Your life is too precious to lose, even when you cannot see a way forward right now. Are you safe right at this moment? Please call Tele-MANAS at 14416 (toll-free, 24/7) or 112. Can you reach out to a trusted friend or family member right now?",
      "I hear how desperately you want this pain to stop. Wanting the pain to stop is understandable, but ending your life is not the only way. Please call Tele-MANAS at 14416 or emergency services at 112 right now. Are you alone right now?",
      "Please stop and take one breath with me. You do not have to make any irreversible decisions tonight. Connect with someone trained to help: call 14416 or 112 right now. Can you tell me if you have any means of harm near you?",
      "I hear your cry for relief. Please know that real human help is ready for you this very second. Call 14416 (Tele-MANAS) or National Emergency 112. Who is one person in your life you can call right now?",
      "I am deeply concerned about your safety. Please put any harmful items away and sit down in a safe, visible place. Call Tele-MANAS at 14416 or 112 immediately. Can you keep yourself safe while we get you connected?",
      "You are in deep pain, but you are not beyond help. Free, confidential support is available 24/7 in India: call Tele-MANAS at 14416 or Emergency 112. Is there a roommate, family member, or neighbor you can knock on right now?",
      "Please stay here with me. The world needs you in it, even if your mind is telling you otherwise right now. Call 14416 right now to speak with someone who cares. Can you tell me if you are safe right now?",
      "Your safety is my absolute priority. If you have done something to hurt yourself or are about to, please call 112 immediately or go to the nearest emergency room. Are you physically hurt right now?",
      "I hear the depth of your despair. Please give yourself one more hour, one more day, and reach out for support: call Tele-MANAS at 14416 or 112. What is your immediate location — are you in a safe room?",
      "You don't have to fight this overwhelming urge all by yourself. There are counselors ready to talk you through this second by second. Call 14416 (24/7, toll-free) or 112. Can you make that call right now?",
      "Please pause. Put both feet on the floor and breathe. If you are having thoughts of suicide, call Tele-MANAS at 14416 or Emergency 112 immediately. Is there someone you trust who can come over right now?",
      "I hear how terrifying and heavy these thoughts are. You matter, and your safety matters. Please connect with emergency services at 112 or Tele-MANAS at 14416. Are you able to stay safe for the next few minutes?",
      "Please know that you don't have to carry this alone for another minute. Reach out to Tele-MANAS at 14416 or emergency help at 112. If you are outside India, please contact your local emergency number immediately. Are you safe?",
      "I want to make sure you stay alive through this dark night. Help is real, and people care. Call 14416 (Tele-MANAS) or 112 right now. Can you step into a room where someone else is present?",
      "Do not give up on yourself tonight. The pain you feel is real, but it can be treated and relieved with the right help. Call 14416 or 112 right now. Who can you call to be with you right now?",
      "If you cannot keep yourself safe right now, please call 112 or go to the nearest hospital immediately. Your life is valuable. Are you in immediate physical danger?",
      "I hear how hopeless things feel, but please hold on. You deserve a chance to heal. Call Tele-MANAS at 14416 or Emergency 112 immediately. Can you confirm for me that you are safe right now?",
      "Please put your safety first. These thoughts are an emergency, just like a physical injury. Call 14416 or 112 right now. Can you open your door and sit with family or a neighbor?",
      "I am an AI and cannot replace emergency intervention, but I urge you with all my care to call Tele-MANAS at 14416 or 112 immediately. Please stay safe. Are you alone right now?",
      "Hold on for just a moment longer. The pain will not always feel this sharp. Call 14416 or 112 right now to connect with someone who can help you through tonight. Will you make that call?"
    ]
  },
  // 2. Stated Self-Harm Urge & Physical Safety (25 items)
  {
    cat: "self_harm_physical_safety",
    kw: ["cut myself", "hurt myself", "burn myself", "harm myself", "bleeding", "urge to hurt myself", "pain to feel something"],
    items: [
      "I hear how strong the urge to hurt yourself is right now, and I want you to know I care about your physical safety 💙 Can you delay acting on this urge for just 15 minutes? Put any sharp or harmful objects in another room right now.",
      "Self-harm is often a desperate attempt to cope with unbearable emotional pain, but you deserve relief without hurting your body. Are you physically injured right now? If you need medical attention, please call 112 immediately.",
      "Please take a deep breath and keep your hands safe. Try holding an ice cube tightly, snapping a rubber band on your wrist, or drawing on your skin with a red marker instead. Can you try the ice cube technique right now?",
      "Your body deserves to be protected and cared for, especially when your mind is in deep distress. Put harmful objects out of reach and sit somewhere safe. Can you call Tele-MANAS at 14416 to talk through this intense urge?",
      "If you have already injured yourself, please clean the wound and seek medical care immediately by calling 112 or going to an urgent care clinic. Are you bleeding or in pain right now?",
      "The urge to self-harm feels overwhelming in the moment, but the physical wave of an urge typically crests and drops within 20 minutes. Ride out this wave without harming yourself. Can you wait 20 minutes with me?",
      "Please put down anything that could hurt you. Wrap yourself tightly in a blanket, squeeze a pillow with all your strength, or tear up scrap paper to release the physical pressure. What can you squeeze or tear instead?",
      "I hear how intense the emotional pressure inside you is. You don't have to hurt your skin to prove your pain is real — I believe you. Please call 14416 (Tele-MANAS) or 112 for support. Can you keep yourself safe?",
      "If you cannot keep your hands safe right now, please go to a room where someone else is present or call someone immediately. Is there someone in your home right now?",
      "Taking your pain out on your body will only add physical guilt and hurt to emotional distress. You deserve gentleness tonight. Put the harmful items away. Did you move the items away?",
      "When the urge to harm yourself is screaming, blast loud music through headphones, take a freezing cold shower, or scream into a pillow to reset your sensory system. Can you take a cold shower instead?",
      "I care about your wellbeing. Please step away from anything harmful and call Tele-MANAS at 14416. It is free, confidential, and 24/7. Will you reach out to them right now?",
      "Please check in with your physical body: take three deep, trembling breaths and unclench your fists. You can survive this wave without hurting yourself. How does your body feel right now?",
      "If you have taken pills, swallowed something dangerous, or have deep cuts, call 112 or an ambulance immediately. Do not wait. Are you in need of urgent medical help right now?",
      "Your scars and body are worthy of healing and protection. Please delay any self-harm tonight. Can you promise yourself that you will keep your body safe for tonight?",
      "Distract your hands immediately: hold a pet, squeeze stress putty, wash your hands in warm soapy water, or write out your feelings furiously on paper. What can you hold in your hands right now?",
      "I hear how desperate you are to feel something different. Call Tele-MANAS at 14416 right now to speak with a counselor who understands self-harm urges and won't judge you. Will you call them?",
      "Please step outside into fresh air or into a public living space right now. Physical isolation makes self-harm urges much harder to resist. Can you move into another room?",
      "Your life and physical integrity are worth protecting, even when you feel numb or furious. Please stay safe. Are you in immediate danger of hurting yourself right now?",
      "Let's count backward from 100 by 7s, or name every animal you can think of starting with the letter A. Force your brain into cognitive distraction to break the urge loop. What is an animal starting with A?",
      "If you are feeling an uncontrollable urge, call someone who loves you right now and say: 'I am struggling to keep myself safe, please stay on the phone with me.' Who can you call right now?",
      "Self-harm urges pass if you give them time to cool down. Drink a huge glass of ice-cold water right now. Did you take a sip of water?",
      "I want you to be safe tomorrow morning. Please don't hurt yourself tonight. Call 14416 (Tele-MANAS) or 112. Can you tell me if you are safe right now?",
      "Please be kind to your skin and body tonight. You have been through so much. Let yourself rest without bleeding or bruising. Can you tuck yourself into bed safely?",
      "I am here, and I want you safe. Please put down any objects and call 14416 or 112 right now. Are you safe in this moment?"
    ]
  },
  // 3. Stated Crisis Plan or Means Available (25 items)
  {
    cat: "crisis_plan_means_available",
    kw: ["have pills", "have a weapon", "have a rope", "wrote a note", "saying goodbye", "have a plan", "ready to go"],
    items: [
      "I am extremely concerned for your life right now 💙 If you have a plan and means to harm yourself, this is an acute emergency. Please step away from those means immediately and call 112 or Tele-MANAS at 14416 right now. Can you step away?",
      "Please put down any means or pills right this second. Your life is in immediate danger, and you must not be alone. Call 112 immediately or go to the nearest emergency room. Are you safe?",
      "If you have gathered means to end your life, please hand them to someone else in your home right now or call emergency services at 112. Do not stay alone with those items. Can you move to another room?",
      "I hear that you have a plan, and that tells me you are in critical danger. Please stop right now. Call Tele-MANAS at 14416 or National Emergency 112 immediately. Who can you wake up or call right now?",
      "Writing a goodbye note or saying goodbyes is a signal that you need immediate human rescue. Please call 112 or 14416 right now. Someone needs to be with you in person. Is there anyone in the house with you?",
      "Please step away from the edge, from the pills, or from any harmful objects right now. Step back into a safe space. Call 112 immediately. Will you step away right now?",
      "If you have already ingested pills or dangerous substances, call 112 or poisoning emergency immediately. Do not wait for symptoms to begin. What did you take, and have you called for help?",
      "Your life is too precious to end tonight. Please put the plan on hold and give human helpers a chance to support you. Call 14416 (Tele-MANAS, toll-free 24/7) or 112. Are you able to call right now?",
      "I hear how decided you feel, but crisis tunnel vision makes it impossible to see the alternatives right now. Please call 112 or 14416 immediately. Can you keep yourself safe while help arrives?",
      "Please open your front door and call out to a neighbor or family member right now if you have means ready. You must not be alone. Who is the closest person physically to you?",
      "Throw the harmful means into the trash or lock them away right now. Remove the immediate temptation. Call Tele-MANAS at 14416 or 112. Have you removed the means?",
      "If you have a weapon or lethal means nearby, please put it down and step into another room with your hands empty. Call 112 immediately. Are your hands empty right now?",
      "This is an urgent safety priority. Please do not act on this plan. Connect with emergency services at 112 or Tele-MANAS at 14416 right this second. Can you confirm you are safe right now?",
      "I hear how exhausted you are, but this plan will cause irreversible devastation. Please pause and call 14416 or 112. Can you promise to hold off on this plan for tonight?",
      "If you are saying goodbye to loved ones, please tell them the truth: 'I am in severe crisis and need you to come over right now.' Will you send that text to someone you trust?",
      "Please step back. Take three deep breaths and drop any objects you are holding. Call Tele-MANAS at 14416 immediately. What room are you in right now?",
      "Your brain is in emergency shutdown mode, but you can still choose to step away from the danger. Call 112 or 14416 right now. Are you physically away from the means?",
      "If you cannot control your actions around these means, call 112 or go to the nearest emergency room immediately. You need a safe hospital environment tonight. Can someone drive you?",
      "Please don't carry out this plan. Give yourself one more chance by speaking to a counselor right now at 14416 (toll-free, 24/7). Will you dial 14416 on your phone?",
      "I want you to be alive tomorrow. Please put away the means and step out of the room. Call 112 or 14416 immediately. Did you leave that room?",
      "You are in extreme danger, and I care about your survival. Please call Tele-MANAS at 14416 or Emergency 112 right now. Is there someone with you right now?",
      "If you are sitting near a high place, window, or road, please step back inside and sit flat on the floor immediately. Call 112. Are you sitting safely on the floor inside?",
      "Please stop and think of anyone who has ever shown you kindness. Let them help you tonight. Call 112 or 14416 right now. Can you call a trusted friend right now?",
      "I am an AI assistant and cannot physically be there, which is why you must contact emergency services at 112 or 14416 right now. Please keep yourself safe. Are you safe?",
      "Hold on. Do not do this. Step away from the means and dial 14416 or 112 right now. I want you to live through this. Can you confirm you are safe?"
    ]
  },
  // 4. Emergency Directives: India 112 & Tele-MANAS 14416 (25 items)
  {
    cat: "emergency_directives_india",
    kw: ["14416", "112", "helpline", "emergency number", "police", "ambulance", "hospital", "telemanas"],
    items: [
      "In India, free, confidential mental health support is available 24/7 through Tele-MANAS: dial 14416 toll-free right now. For immediate danger or physical medical emergencies, dial 112 immediately. Please call one of these numbers right now.",
      "Tele-MANAS is a government-supported 24/7 mental health crisis service in India. You can speak to trained counselors in multiple languages by calling 14416 (toll-free). Please dial 14416 right now. Are you able to dial?",
      "If you or someone near you is in immediate physical danger, call 112 (National Emergency Number for India) right away for an ambulance or immediate assistance. Please connect with 112 or 14416 immediately.",
      "You do not have to pay anything to get help: Tele-MANAS is completely toll-free at 14416 from any phone in India. They are available day and night. Please pick up your phone and call 14416 right now.",
      "Emergency resources in India: Tele-MANAS (Mental Health) is 14416; National Emergency Services (Ambulance/Police) is 112; Kiran Helpline is 1800-599-0019. Please call 14416 or 112 right now for immediate support.",
      "If you are experiencing acute suicidal thoughts, dial 14416 right now. Counselors are waiting to listen and help you through this exact crisis without judgment. Can you make that call right now?",
      "Please don't hesitate: dialing 112 or 14416 is the fastest way to get real human support right now. Are you safe while you dial one of these numbers?",
      "Tele-MANAS (14416) operates in over 20 Indian languages, providing compassionate, specialized crisis counseling. Pick up your phone and call 14416 right now. What language do you feel most comfortable speaking?",
      "If you need immediate physical protection or medical intervention, dial 112 right now. If you need someone to talk you down from a crisis, dial 14416. Please call now.",
      "You are not bothering anyone by calling 14416 or 112. Those helplines exist specifically for people experiencing the exact pain you are feeling right now. Please dial 14416 right now.",
      "Emergency helpline reminder: Call 14416 (Tele-MANAS) or 112 (Emergency). Both numbers are active 24/7 across India. Please connect with them right now.",
      "If you are unable to speak aloud on the phone, ask someone in your home to call 112 or 14416 on your behalf, or go directly to the nearest hospital casualty ward. Can you tell someone in your home?",
      "Please tap the emergency button or dial 14416 on your phone keypad. Tele-MANAS will connect you to a trained counselor. Will you call them right now?",
      "Immediate danger requires immediate human action: call 112 or Tele-MANAS at 14416 right now. Please keep yourself safe. Are you dialling now?",
      "In moments of extreme crisis, professional intervention is lifesaving. Call 14416 (toll-free) or 112. You deserve this support. Can you confirm that you have these numbers on your screen?",
      "Call Tele-MANAS at 14416 right now. Let a counselor hold this heavy weight with you for a while. You don't have to explain everything perfectly; just say 'I am in crisis.' Will you call?",
      "If you are outside India, please contact your local emergency services (like 988 in the US/Canada, 111/999 in the UK) or go to the nearest emergency room. Are you located in India or elsewhere?",
      "Tele-MANAS at 14416 has helped thousands of individuals navigate their darkest hours. Give yourself that same chance tonight. Dial 14416 right now.",
      "Please do not wait. The sooner you call 14416 or 112, the sooner you will feel human care and safety. Are you dialling now?",
      "If you feel hesitant to call 14416, remember that they are trained, anonymous, and will not judge you. You have nothing to lose by calling. Will you try dialling 14416?",
      "National Emergency (112) can dispatch medical and safety assistance to your location if you are unable to stay safe. Please call 112 immediately if you are in danger.",
      "Keep Tele-MANAS (14416) and Emergency (112) ready on your phone at all times. If you feel your safety slipping, press call immediately. Are you safe right now?",
      "Counselors at 14416 understand self-harm, deep depression, and crisis. Let them walk with you through tonight. Please call 14416 right now.",
      "Dial 112 for immediate emergency dispatch in India, or 14416 for 24/7 mental health crisis support. Your life matters. Can you confirm you are safe?",
      "I urge you to call Tele-MANAS at 14416 or 112 right now. Please stay safe and let human professionals support you tonight. Are you making the call?"
    ]
  },
  // 5. Contacting a Trusted Person & Physical Presence (25 items)
  {
    cat: "trusted_person_contact",
    kw: ["call a friend", "tell my parents", "trusted person", "physically present", "don't be alone", "wake someone up"],
    items: [
      "When crisis thoughts peak, being alone is dangerous. Please do not stay alone in your room tonight 💙 Go to wherever someone else is in your home, or call someone to come over right now. Who is physically nearest to you?",
      "Please call a trusted friend, family member, or neighbor right now and say: 'I am really struggling tonight and I need company.' Will you call someone right now?",
      "Having someone physically present in the room significantly reduces the risk of impulsive self-harm. Walk into the living room or knock on your family member's door. Can you go do that right now?",
      "If it's late at night, wake someone up. The people who care about you would a million times rather be woken up tonight than lose you tomorrow. Who can you wake up right now?",
      "Send this exact text to a close friend or parent right now: 'I'm having a really hard time keeping myself safe tonight. Can you call me or come over?' Can you send that text?",
      "Isolation magnifies crisis pain. Connect with a human voice right now: call a friend, call family, or call Tele-MANAS at 14416. Who is the first person in your contacts list you trust?",
      "Ask a trusted person to come over and sit with you, even if you don't talk. Just having another breathing person in the room grounds your nervous system. Who can come over?",
      "If you live alone, call a friend and ask them to stay on the phone with you while you get ready for bed or while you wait for support. Who can you call to stay on the line?",
      "You are not a burden for needing human help in a crisis. You would do the same for someone you loved. Please reach out to someone who cares about you right now. Who comes to mind?",
      "Go to a public place if you are alone: sit in a busy living area, a 24-hour store, or a hospital lobby where other people are around. Can you get around other people right now?",
      "Please don't let shame stop you from reaching out. The people who love you want to support you through this. Pick up the phone and call someone right now. Who will you call?",
      "Ask someone you trust to hold onto your car keys, medications, or any harmful items for the night. That is a brave, proactive step of safety. Who can hold those items for you?",
      "Call a family member and just listen to their voice. You don't have to share every detail if you don't want to; just ask them to talk to you. Can you call them right now?",
      "If you don't feel comfortable telling family, call a trusted friend, a teacher, a mentor, or dial Tele-MANAS at 14416. Who in your life feels safest to speak with?",
      "Please step out of your bedroom and into a shared space right now. Being around others breaks the intense isolation of crisis. Can you step out of your room?",
      "Tell someone you trust: 'I am not okay right now and I need support.' Saying those words out loud brings immense relief. Can you say that to someone nearby?",
      "Call someone right now and put them on speakerphone. Even hearing familiar background noise helps you stay anchored in reality. Who can you call?",
      "If you feel completely disconnected from everyone in your contacts, remember that counselors at Tele-MANAS (14416) are ready to be that human connection for you tonight. Will you call 14416?",
      "Your life is too precious to gamble on staying alone with these thoughts. Please connect with someone physically present or on the phone immediately. Are you alone right now?",
      "Knock on your neighbor's or roommate's door. People are generally kind and willing to help in an emergency. Can you knock on a door right now?",
      "Share your location with a trusted friend and ask them to check in on you. Can you send your location to someone right now?",
      "Don't fight this battle in silence. Let someone who loves you know that you are hurting. Who can you reach out to tonight?",
      "Human connection is the most powerful antidote to despair. Reach out to a real person right now, or call 14416 / 112. Who will you reach out to?",
      "Please make the call to someone who cares about you. You deserve to be held, heard, and protected tonight. Who can you contact?",
      "I want you safe. Please connect with someone in your life right now or call emergency services at 112 or Tele-MANAS at 14416. Are you safe right now?"
    ]
  },
  // 6. Staying Safe Right Now / Delaying Harm (25 items)
  {
    cat: "staying_safe_delaying_harm",
    kw: ["delay", "wait 10 minutes", "promise me", "stay safe tonight", "make a deal", "hold on"],
    items: [
      "Can we make a deal right now? Promise me you will wait just 15 minutes before doing anything irreversible 💙 In those 15 minutes, focus entirely on breathing and drinking water. Can you agree to 15 minutes?",
      "You don't have to decide your whole future tonight. Your only job right now is to stay alive for the next hour. Can you stay safe for the next hour with me?",
      "When crisis thoughts peak, delaying action by even 10 minutes allows the acute neurochemical surge to subside. Put everything on pause for 10 minutes. Can you set a 10-minute timer?",
      "Sit on the floor with your back against a solid wall. Feel the wall supporting your spine. You are physically supported. Can you sit against a wall right now?",
      "Delaying self-harm or suicide is a victory in itself. Give yourself permission to pause: 'I will wait until morning before making any decisions.' Can you wait until morning?",
      "Wash your face with cold water or hold an ice cube right now. Physical shock resets emotional intensity. Will you go wash your face with cold water?",
      "Take things second by second if minutes feel too long. Just breathe through this second, and then the next. Are you breathing with me right now?",
      "Wrap yourself in a heavy blanket and lie on your side in the recovery position. Let your body rest without demanding anything else from yourself. Can you wrap yourself in a blanket?",
      "Promise yourself that you will give tomorrow a chance. The way you feel right now at 2 AM is not how you will feel forever. Can you hold on until sunrise?",
      "Distract your mind completely: count backwards from 100 by 7, name 10 movies you've seen, or recite song lyrics out loud. What is one song you know by heart?",
      "Put your hands in your pockets or under your thighs so your hands stay safe and still. Keep your hands still while we talk. Are your hands safe?",
      "You have survived 100% of your worst days so far, and you can survive this one too if you delay action and reach out for help. Call 14416 or 112. Can you hold on?",
      "Write down the reasons you want to live — even small ones like your pet, morning coffee, or seeing a favorite show. What is one tiny thing you'd miss?",
      "If your thoughts are racing uncontrollably, turn on a television or podcast at medium volume to interrupt the silence. What comforting audio can you put on?",
      "Make a safety contract with yourself: 'I will not harm myself tonight, and I will call 14416 if I feel I cannot stay safe.' Can you make that promise to yourself?",
      "Lie down on your bed and focus purely on the weight of your body pressing into the mattress. You are safe in this bed. Are you lying down comfortably?",
      "Drink a warm, sweet drink like hot chocolate or warm milk. It activates your digestive system and naturally calms the nervous system. Can you get a warm drink?",
      "Remind yourself that your feelings, however intense, are temporary states. They do not have the power to force you to harm yourself. Can you ride this wave out?",
      "Stay in the present moment: look at your hands, look at your shoes, feel your heartbeat. You are alive right now, and that matters. Can you feel your heartbeat?",
      "Please give yourself grace and time. You don't have to carry out what the dark thoughts are telling you. What is one reassuring thought you can hold onto?",
      "Focus on the physical rhythm of your breath: in for 4, out for 6. Let each exhale release a tiny fraction of the crisis tension. How does your breath feel?",
      "If you are feeling overwhelmed, remember that tomorrow brings new light, new help, and new possibilities. Hold on for tomorrow. Will you wait for tomorrow?",
      "Keep yourself safe right now. You are doing an incredible job just breathing through this immense pain. Can you confirm you are safe at this moment?",
      "Put your phone on your chest and feel the steady rhythm of your breathing. Stay still and quiet. Are you in a safe spot?",
      "I believe in your strength to get through this hour. Call Tele-MANAS at 14416 or Emergency 112 if you need a human voice immediately. Are you safe right now?"
    ]
  },
  // 7. Third-Person Crisis Intervention (Helping a Friend) (25 items)
  {
    cat: "third_person_crisis",
    kw: ["my friend wants to die", "friend is suicidal", "roommate is cutting", "friend sent goodbye text", "worried about someone else"],
    items: [
      "If your friend or loved one is expressing suicidal thoughts or in immediate danger, take it very seriously 💙 If they are in immediate danger of hurting themselves, call National Emergency 112 immediately. Where is your friend right now?",
      "Do not leave your friend alone if they have stated a plan or intent to end their life. Stay physically with them or keep them on the phone while someone calls emergency help. Are you with your friend right now?",
      "Ask your friend directly and calmly: 'Are you thinking about suicide, and do you have a plan?' Asking directly does not plant the idea; it provides immense relief. Can you ask them that directly?",
      "Help your friend connect to Tele-MANAS: dial 14416 together on speakerphone so a trained counselor can guide you both through this crisis. Can you call 14416 with your friend?",
      "If your friend sent you a goodbye text and is not answering their phone, do not wait: call 112 immediately or notify their parents, roommates, or local police for a welfare check. Do you know their address?",
      "Encourage your friend to remove any harmful objects or pills from their room, or offer to hold onto them for their safety. Can you help them clear their space?",
      "Listen to your friend with empathy without judging, scolding, or minimizing their pain. Let them know you care about their life and want them safe. What is your friend saying?",
      "If you are at school or college, contact the campus resident advisor, counselor, or security immediately to help locate and support your friend. Is there campus security nearby?",
      "Do not agree to keep your friend's suicide plan a secret. A broken confidence is infinitely better than a lost life. Share this with a trusted adult or professional immediately. Who can you tell?",
      "Remind your friend that help is available and that their pain can be treated. Offer to walk with them to a clinic or hospital emergency room. Can you take them to a hospital?",
      "If your friend is intoxicated or under the influence while expressing crisis thoughts, their risk of impulsive harm is heightened. Stay with them and call 112. Are they under the influence?",
      "You are being an incredible friend by taking their distress seriously. Make sure you also take care of yourself; supporting someone in crisis is heavy. How are you holding up?",
      "Give your friend the Tele-MANAS number (14416) and emergency number (112) and stay on the line until they have connected with someone. Did you share those numbers with them?",
      "If your friend lives far away, contact their local emergency services or someone who lives with them to check on them immediately. Do you know anyone who lives with them?",
      "Tell your friend: 'You matter so much to me, and I cannot lose you. Let's get help together right now.' Sharing your care can anchor them. Can you tell them that?",
      "If your friend has already harmed themselves or taken something, call an ambulance at 112 immediately. Do not wait for symptoms to worsen. Are they physically hurt?",
      "Stay calm and speak in a soft, steady voice. Your calm presence will help ground your friend's racing nervous system. Are you able to speak calmly with them?",
      "Help your friend identify what they need in the next hour: water, fresh air, a warm blanket, or sitting quietly together. What would comfort your friend right now?",
      "Suggest that your friend stays over at your place tonight, or offer to stay at theirs, so they are not alone. Can you arrange to stay together tonight?",
      "If your friend refuses help and is in immediate danger of ending their life, calling 112 or their family is an act of lifesaving love. Don't hesitate to escalate to emergency services.",
      "Tele-MANAS (14416) can also advise you on how to handle a friend in crisis. You can call 14416 and ask: 'How can I help my suicidal friend right now?' Would you call them?",
      "Reassure your friend that needing help does not mean they are broken or will be locked away; it means they deserve relief from this unbearable pain. What is your friend's main fear?",
      "Stay on the phone with your friend until someone else arrives to be with them in person. Do not hang up while they are in active crisis. Are you on the phone with them?",
      "Thank you for being a vigilant, caring friend. Your quick action could save a life tonight. Please keep 112 and 14416 ready. What is your next move?",
      "Please keep me updated on your friend's safety. Make sure both of you are connected to real human help tonight. Are you both safe right now?"
    ]
  },
  // 8. Nighttime Crisis & Severe Isolation Protocol (25 items)
  {
    cat: "nighttime_crisis_protocol",
    kw: ["late at night", "2 am", "3 am", "middle of the night", "dark outside", "everyone is asleep", "wake up tomorrow"],
    items: [
      "Late night hours can feel agonizingly quiet, making dark thoughts seem ten times louder and more convincing 💙 Remember that night distorts perspective. Please hold on until morning and call Tele-MANAS at 14416 right now.",
      "Everything feels heavier at 3 AM when the world is asleep. But the morning sun will bring a new perspective, open clinics, and waking friends. Can you give yourself until sunrise? Call 14416 or 112 right now.",
      "Tele-MANAS at 14416 is awake right now. You don't have to wait for business hours; counselors are staffing the phones this very second. Please pick up your phone and dial 14416 right now.",
      "If everyone in your house is asleep and you feel unsafe, wake someone up. A loved one will gladly wake up in the middle of the night to keep you safe. Who can you wake up right now?",
      "Turn on the lights in your room right now. Darkness amplifies isolation and fear; bright light signals to your brain that you are awake and present. Turn on your lamps right now. Did you turn on the lights?",
      "If you cannot sleep and your mind is dark, get out of bed, wrap yourself in a blanket, and sit in a well-lit living room with a cup of warm water. Step away from the bed. Can you do that right now?",
      "Put on a comforting television show, a friendly YouTube video, or a gentle podcast at low volume so your room is filled with human voices instead of silence. What show can you turn on?",
      "The night is temporary. In just a few hours, the birds will sing and the daylight will break through. Hold on for the sunrise. Can you promise to wait for sunrise?",
      "If you feel that you cannot stay safe until morning, call 112 immediately or take a taxi to the nearest hospital emergency room. Hospitals never close. Is there a hospital near you?",
      "Late-night crisis is an emergency, not an inconvenience. Do not apologize for seeking help at night. Dial 14416 right now (it is completely free and active 24/7). Will you call?",
      "Wrap yourself tightly in your blanket and lie still. Tell yourself: 'I don't need to solve anything tonight. I just need to sleep and stay alive.' Can you let your body rest?",
      "Sip a warm drink and breathe. You have survived difficult nights before, and you will survive this night too. How are your breaths feeling right now?",
      "If racing thoughts are keeping you in danger, write them all down on a piece of paper, fold it up, and place it in another room. Tell your brain they will be addressed in the daylight. Can you try that?",
      "Listen to the sound of rain, gentle waves, or white noise through your phone. It fills the vacuum of the night with steady, calming rhythm. Do you have soothing sounds available?",
      "You are not alone in the night. Right now, counselors at 14416 are answering calls from other people who need comfort. Join that circle of care: call 14416 right now.",
      "If your hands are restless and unsafe, hold two ice cubes or run cold water over your wrists in the bathroom. The physical sensation will snap you out of nighttime dissociation. Can you go to the sink?",
      "Look out the window and look at the sky or streetlights. The world is resting, and you are allowed to rest too. You don't have to carry the burden right now. What do you see out the window?",
      "Remember: your brain is physically exhausted right now, which magnifies despair. Do not trust decisions made when your brain is starved of sleep. Wait for daylight. Can you wait?",
      "If you feel terrified of being alone in the dark, move to a couch in the living room or sleep in the same room as a family member or pet. Can you go sleep near someone else?",
      "Call a 24-hour helpline right now: 14416 (Tele-MANAS) or 112. Let a kind voice guide you to sleep safely. Will you call 14416 right now?",
      "Stay in this chat with me until you feel steady enough to rest. You don't have to face the quiet alone. What can we talk about that brings a little comfort?",
      "Tell yourself: 'This is night-time distortion. Things will look different in the morning light.' Hold onto that truth. How does that thought feel?",
      "Please stay safe tonight. Your life is too valuable to lose in the quiet of the night. Emergency help is always awake at 112 and 14416. Are you safe in this room?",
      "Take another steady, grounding breath. Inhale calm, exhale the darkness. You are going to make it through tonight. Can you feel your breath?",
      "I am holding space for you until the morning comes. Please stay safe, put away any harmful items, and call 14416 or 112 if you need someone right now. Are you safe right now?"
    ]
  }
];

// Helper to expand templates to exactly 200 distinct items per level
function expandToExactCount(categoriesList, targetCount = 200, levelPrefix = "L1") {
  const result = [];
  let idCounter = 1;

  for (const group of categoriesList) {
    for (const itemText of group.items) {
      result.push({
        id: `${levelPrefix}_${String(idCounter++).padStart(3, "0")}`,
        category: group.cat,
        keywords: group.kw,
        text: itemText.trim()
      });
    }
  }

  // Ensure exactly targetCount distinct items
  if (result.length < targetCount) {
    throw new Error(`Insufficient templates for ${levelPrefix}: got ${result.length}, expected ${targetCount}`);
  }

  return result.slice(0, targetCount);
}

const level1Responses = expandToExactCount(L1_TEMPLATES, 200, "L1");
const level2Responses = expandToExactCount(L2_TEMPLATES, 200, "L2");
const level3Responses = expandToExactCount(L3_TEMPLATES, 200, "L3");

console.log(`Generated Level 1 Responses: ${level1Responses.length}`);
console.log(`Generated Level 2 Responses: ${level2Responses.length}`);
console.log(`Generated Level 3 Responses: ${level3Responses.length}`);

// Verify all 200 responses per level are unique
function verifyUnique(arr, name) {
  const texts = new Set(arr.map(r => r.text));
  if (texts.size !== arr.length) {
    throw new Error(`Duplicate responses found in ${name}: ${arr.length} items but only ${texts.size} unique!`);
  }
  // Check word counts < 200 words
  for (const r of arr) {
    const wordCount = r.text.split(/\s+/).length;
    if (wordCount > 200) {
      console.warn(`Warning: ${r.id} exceeds 200 words (${wordCount} words)`);
    }
  }
}

verifyUnique(level1Responses, "Level 1");
verifyUnique(level2Responses, "Level 2");
verifyUnique(level3Responses, "Level 3");
console.log("All 600 responses verified unique and within target word bounds!");

// Now write backend/responseLibraries.js
const fileContent = `// ============================================================================
// CalmChain Response Libraries
// Contains exactly 200 distinct, categorized reference responses for Level 1,
// 200 for Level 2, and 200 for Level 3 (Total = 600 distinct reference responses).
// Used for contextual retrieval, few-shot prompt grounding, and offline routing.
// ============================================================================

const LEVEL_1_RESPONSES = ${JSON.stringify(level1Responses, null, 2)};

const LEVEL_2_RESPONSES = ${JSON.stringify(level2Responses, null, 2)};

const LEVEL_3_RESPONSES = ${JSON.stringify(level3Responses, null, 2)};

/**
 * Returns current statistics of the response libraries.
 */
function getResponseLibraryStats() {
  return {
    level1Count: LEVEL_1_RESPONSES.length,
    level2Count: LEVEL_2_RESPONSES.length,
    level3Count: LEVEL_3_RESPONSES.length,
    totalCount: LEVEL_1_RESPONSES.length + LEVEL_2_RESPONSES.length + LEVEL_3_RESPONSES.length
  };
}

/**
 * Contextual Retrieval Engine:
 * Finds the most relevant reference response from the specified level library
 * based on semantic keywords, category alignment, and conversation history.
 */
function findBestReferenceResponse(level, queryText = "", contextHistory = []) {
  const library = level === 3
    ? LEVEL_3_RESPONSES
    : level === 2
    ? LEVEL_2_RESPONSES
    : LEVEL_1_RESPONSES;

  if (!queryText || typeof queryText !== "string") {
    return library[0];
  }

  const cleanQuery = queryText.toLowerCase().replace(/[^\\w\\s']/g, " ");
  const queryTokens = cleanQuery.split(/\\s+/).filter(t => t.length > 2);

  // Consider last 2 history messages for context
  let historyTokens = [];
  if (Array.isArray(contextHistory) && contextHistory.length > 0) {
    const recentHistoryText = contextHistory.slice(-2).map(m => m.text || "").join(" ").toLowerCase();
    historyTokens = recentHistoryText.split(/\\s+/).filter(t => t.length > 3);
  }

  let bestMatch = library[0];
  let maxScore = -1;

  for (const item of library) {
    let score = 0;

    // 1. Keyword matching
    if (Array.isArray(item.keywords)) {
      for (const kw of item.keywords) {
        if (cleanQuery.includes(kw)) {
          score += 6;
        }
        for (const token of queryTokens) {
          if (kw.includes(token)) {
            score += 2;
          }
        }
      }
    }

    // 2. Token overlap with response text
    const itemTokens = item.text.toLowerCase().split(/\\s+/);
    for (const token of queryTokens) {
      if (itemTokens.includes(token)) {
        score += 1;
      }
    }

    // 3. History relevance
    for (const hToken of historyTokens) {
      if (itemTokens.includes(hToken)) {
        score += 0.5;
      }
    }

    if (score > maxScore) {
      maxScore = score;
      bestMatch = item;
    }
  }

  return bestMatch;
}

module.exports = {
  LEVEL_1_RESPONSES,
  LEVEL_2_RESPONSES,
  LEVEL_3_RESPONSES,
  getResponseLibraryStats,
  findBestReferenceResponse
};
`;

const outputPath = path.join(__dirname, "responseLibraries.js");
fs.writeFileSync(outputPath, fileContent, "utf8");
console.log(`Successfully wrote ${outputPath} with 600 responses!`);
