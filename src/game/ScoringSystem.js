/**
 * ScoringSystem - Evaluates conversation quality and computes stage score.
 */
import { scoreConversation } from '../api/elevenlabs.js';
import { CONFIG } from './Config.js';

export class ScoringSystem {
  static DIMENSIONS = [
    'fluency', 'pronunciation', 'naturalness',
    'vocabulary', 'grammar', 'nativeLikeness'
  ];

  static WEIGHTS = {
    fluency: 0.2,
    pronunciation: 0.2,
    naturalness: 0.15,
    vocabulary: 0.15,
    grammar: 0.2,
    nativeLikeness: 0.1
  };

  constructor() {}

  /**
   * Evaluate a conversation and return a full score result.
   * @param {object[]} transcriptHistory
   * @param {number} conversationTime - Duration in seconds
   * @returns {Promise<object>} ScoreResult
   */
  async evaluate(transcriptHistory, conversationTime) {
    const dimensions = await scoreConversation(transcriptHistory);
    const qualityScore = this.computeQualityScore(dimensions);
    const finalScore = this.computeFinalScore(qualityScore, conversationTime);
    const starRating = this.getStarRating(finalScore);

    return {
      fluency: dimensions.fluency,
      pronunciation: dimensions.pronunciation,
      naturalness: dimensions.naturalness,
      vocabulary: dimensions.vocabulary,
      grammar: dimensions.grammar,
      nativeLikeness: dimensions.nativeLikeness,
      qualityScore,
      finalScore,
      starRating,
      conversationTime
    };
  }

  /**
   * Compute weighted quality score from dimension scores.
   * @param {object} dimensions - { fluency, pronunciation, naturalness, vocabulary, grammar, nativeLikeness }
   * @returns {number}
   */
  computeQualityScore(dimensions) {
    const weights = CONFIG.scoring.weights;
    let score = 0;
    for (const dim of ScoringSystem.DIMENSIONS) {
      score += (weights[dim] || 0) * (dimensions[dim] || 0);
    }
    return score;
  }

  /**
   * Compute time-adjusted final score.
   * @param {number} qualityScore
   * @param {number} conversationTime - Duration in seconds
   * @returns {number}
   */
  computeFinalScore(qualityScore, conversationTime) {
    const { timeBaseline, timeMultiplierMin, timeMultiplierMax } = CONFIG.scoring;
    const rawMultiplier = conversationTime / timeBaseline;
    const timeMultiplier = Math.min(Math.max(rawMultiplier, timeMultiplierMin), timeMultiplierMax);
    return timeMultiplier * qualityScore;
  }

  /**
   * Map a final score to a 1-5 star rating.
   * @param {number} finalScore
   * @returns {number}
   */
  getStarRating(finalScore) {
    const raw = Math.floor(finalScore / 20);
    return Math.min(Math.max(raw, 1), 5);
  }
}
