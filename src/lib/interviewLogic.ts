import { RoleType } from '../types/interview';

interface RoleConfig {
  title: string;
  description: string;
  questions: string[];
  followUpTriggers: Record<string, string[]>;
}

export const roleConfigs: Record<RoleType, RoleConfig> = {
  sales: {
    title: 'Sales Representative',
    description: 'Prepare for sales roles focusing on persuasion, client relationships, and closing deals',
    questions: [
      "Tell me about yourself and your experience in sales.",
      "Describe a time when you successfully closed a difficult deal. What was your approach?",
      "How do you handle rejection from potential clients?",
      "Walk me through your sales process from prospecting to closing.",
      "What strategies do you use to build long-term relationships with clients?",
      "How do you stay motivated when you're not meeting your sales targets?",
    ],
    followUpTriggers: {
      'experience': ["Can you give me a specific example?", "What were the results?"],
      'client': ["How did the client respond?", "What would you do differently?"],
      'approach': ["Why did you choose that approach?", "How do you measure success?"],
      'strategy': ["Can you elaborate on that strategy?", "How effective has it been?"],
    }
  },
  engineer: {
    title: 'Software Engineer',
    description: 'Practice technical interviews focusing on problem-solving, coding, and system design',
    questions: [
      "Tell me about your background in software engineering.",
      "Describe a challenging technical problem you solved recently. What was your approach?",
      "How do you stay current with new technologies and programming languages?",
      "Walk me through how you would design a scalable web application.",
      "Tell me about a time when you had to debug a complex issue. What was your process?",
      "How do you approach code reviews and collaborating with other developers?",
    ],
    followUpTriggers: {
      'technical': ["What technologies did you use?", "How did you evaluate different solutions?"],
      'design': ["What trade-offs did you consider?", "How would you handle scaling?"],
      'problem': ["What was the root cause?", "How long did it take to resolve?"],
      'code': ["What coding standards do you follow?", "How do you ensure code quality?"],
    }
  },
  retail_associate: {
    title: 'Retail Associate',
    description: 'Prepare for retail positions focusing on customer service and sales floor management',
    questions: [
      "Tell me about your experience working in retail or customer service.",
      "Describe a time when you dealt with a difficult customer. How did you handle it?",
      "How would you approach a customer who seems hesitant about making a purchase?",
      "What would you do if you noticed a coworker providing poor customer service?",
      "How do you stay organized during busy periods?",
      "Why do you want to work in retail?",
    ],
    followUpTriggers: {
      'customer': ["What was the outcome?", "How did the customer react?"],
      'service': ["Can you give me another example?", "What did you learn from that?"],
      'approach': ["What specific steps did you take?", "How effective was that?"],
      'busy': ["Can you walk me through a specific situation?", "What's your priority system?"],
    }
  },
  marketing: {
    title: 'Marketing Specialist',
    description: 'Practice for marketing roles focusing on campaigns, analytics, and creativity',
    questions: [
      "Tell me about your background in marketing.",
      "Describe a successful marketing campaign you worked on. What made it successful?",
      "How do you measure the effectiveness of a marketing campaign?",
      "How do you stay updated with the latest marketing trends?",
      "Tell me about a time when a campaign didn't perform as expected. What did you do?",
      "How do you balance creativity with data-driven decision making?",
    ],
    followUpTriggers: {
      'campaign': ["What metrics did you track?", "What was your target audience?"],
      'creative': ["How did you come up with that idea?", "What feedback did you receive?"],
      'data': ["What tools do you use for analysis?", "How do you present findings?"],
      'trend': ["How do you apply those trends?", "What's your content strategy?"],
    }
  },
  customer_service: {
    title: 'Customer Service Representative',
    description: 'Prepare for customer service roles focusing on communication and problem resolution',
    questions: [
      "Tell me about your customer service experience.",
      "Describe a time when you turned an angry customer into a satisfied one.",
      "How do you handle multiple customer inquiries at the same time?",
      "What would you do if you didn't know the answer to a customer's question?",
      "How do you maintain patience when dealing with difficult situations?",
      "Why is customer service important to you?",
    ],
    followUpTriggers: {
      'customer': ["What exactly did you say?", "How long did it take to resolve?"],
      'difficult': ["What was the most challenging part?", "What would you do differently?"],
      'handle': ["What's your process?", "How do you prioritize?"],
      'know': ["What resources do you use?", "How quickly can you learn new information?"],
    }
  }
};

export function getInitialQuestion(roleType: RoleType): string {
  return roleConfigs[roleType].questions[0];
}

export function getNextQuestion(
  roleType: RoleType,
  currentQuestionIndex: number,
  previousResponse: string
): { question: string; isFollowUp: boolean } {
  const config = roleConfigs[roleType];

  const shouldAskFollowUp = Math.random() > 0.5 && previousResponse.length > 50;

  if (shouldAskFollowUp && currentQuestionIndex > 0) {
    for (const [trigger, followUps] of Object.entries(config.followUpTriggers)) {
      if (previousResponse.toLowerCase().includes(trigger)) {
        const randomFollowUp = followUps[Math.floor(Math.random() * followUps.length)];
        return { question: randomFollowUp, isFollowUp: true };
      }
    }
  }

  if (currentQuestionIndex < config.questions.length) {
    return { question: config.questions[currentQuestionIndex], isFollowUp: false };
  }

  return {
    question: "Thank you for your responses. Do you have any questions for me about the role or company?",
    isFollowUp: false
  };
}

export function generateFeedback(
  roleType: RoleType,
  exchanges: Array<{ question: string; response: string }>
): {
  overall_score: number;
  communication_score: number;
  technical_score: number;
  strengths: string;
  improvements: string;
  detailed_feedback: string;
} {
  const responses = exchanges.map(e => e.response);
  const avgLength = responses.reduce((sum, r) => sum + r.length, 0) / responses.length;

  const communicationScore = Math.min(10, Math.max(5, Math.floor(avgLength / 50) + 5));

  const hasSpecificExamples = responses.some(r =>
    r.toLowerCase().includes('example') ||
    r.toLowerCase().includes('time when') ||
    r.toLowerCase().includes('situation')
  );
  const technicalScore = hasSpecificExamples ? 8 : 6;

  const overallScore = Math.round((communicationScore + technicalScore) / 2);

  const strengths = [];
  if (avgLength > 100) strengths.push("Provided detailed, thoughtful responses");
  if (hasSpecificExamples) strengths.push("Used concrete examples to illustrate points");
  if (responses.some(r => r.includes('?'))) strengths.push("Asked engaging questions");
  if (strengths.length === 0) strengths.push("Completed the interview and showed interest");

  const improvements = [];
  if (avgLength < 80) improvements.push("Provide more detailed responses with specific examples");
  if (!hasSpecificExamples) improvements.push("Use the STAR method (Situation, Task, Action, Result) for behavioral questions");
  improvements.push("Practice articulating your thoughts more clearly");
  if (roleType === 'engineer') improvements.push("Be ready to discuss technical trade-offs and decisions");

  const detailedFeedback = `
Overall Performance: ${overallScore}/10

Your interview showed ${overallScore >= 7 ? 'strong' : 'good'} potential. ${
  avgLength > 100
    ? "Your responses were well-developed and showed depth of thought."
    : "Consider expanding your responses with more details and examples."
}

${hasSpecificExamples
  ? "You did well providing concrete examples from your experience."
  : "Try to include more specific examples from your past experiences."
}

For ${roleConfigs[roleType].title} interviews, focus on demonstrating both your technical knowledge and your communication skills. ${
  roleType === 'sales'
    ? "Show your passion for building relationships and closing deals."
    : roleType === 'engineer'
    ? "Be ready to discuss technical challenges and your problem-solving approach."
    : "Emphasize your customer-first mindset and problem-solving abilities."
}

Keep practicing and you'll continue to improve!
  `.trim();

  return {
    overall_score: overallScore,
    communication_score: communicationScore,
    technical_score: technicalScore,
    strengths: strengths.join('; '),
    improvements: improvements.join('; '),
    detailed_feedback: detailedFeedback
  };
}
