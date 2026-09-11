/**
 * Skill Badlu — Rule-Based Matchmaking Engine
 * Reference: docs/architecture/system-design.md#52-matchmaking-algorithm-rule-based-weighted-scoring--phase-2-ml
 */

class MatchmakingEngine {
  constructor(store) {
    this.store = store;
    this.weights = {
      w1: 0.3, // Skill Tag Overlap
      w2: 0.15, // Level Compatibility
      w3: 0.35, // Mutual Swap Bonus (Reciprocal Swap)
      w4: 0.1, // Historical Peer Rating
      w5: 0.1 // Activity Recency
    };
  }

  setWeights(newWeights) {
    this.weights = { ...this.weights, ...newWeights };
    this.store.notify("WEIGHTS_UPDATED", this.weights);
  }

  /**
   * Score a specific candidate against the target active user.
   */
  scoreCandidate(candidate, targetUser) {
    if (candidate.id === targetUser.id) return null;

    const candHaveIds = new Set(candidate.skills_have.map((s) => s.skill_id));
    const candWantIds = new Set(candidate.skills_want.map((s) => s.skill_id));
    const userHaveIds = new Set(targetUser.skills_have.map((s) => s.skill_id));
    const userWantIds = new Set(targetUser.skills_want.map((s) => s.skill_id));

    // 1. Tag Overlap: Jaccard(C.have, U.want)
    const intersection = [...candHaveIds].filter((x) => userWantIds.has(x));
    const union = new Set([...candHaveIds, ...userWantIds]);
    const overlapScore =
      union.size > 0 ? intersection.length / union.size : 0.0;

    // 2. Level Compatibility
    // Check if candidate skill level meets or exceeds user desired level
    let levelScores = [];
    intersection.forEach((skillId) => {
      const candSkill = candidate.skills_have.find(
        (s) => s.skill_id === skillId
      );
      const userSkill = targetUser.skills_want.find(
        (s) => s.skill_id === skillId
      );
      if (candSkill && userSkill) {
        levelScores.push(candSkill.level >= userSkill.level ? 1.0 : 0.5);
      }
    });
    const levelCompat =
      levelScores.length > 0
        ? levelScores.reduce((a, b) => a + b, 0) / levelScores.length
        : 0.0;

    // 3. Mutual Swap Bonus (Does target user offer something candidate wants?)
    const mutualOverlap = [...userHaveIds].filter((x) => candWantIds.has(x));
    const isMutualSwap = mutualOverlap.length > 0;
    const mutualBonus = isMutualSwap ? 1.0 : 0.0;

    // 4. Rating Factor (Normalized 1.0 - 5.0 to 0.0 - 1.0)
    const ratingScore = Math.max(
      0.0,
      Math.min(1.0, (candidate.avg_rating - 1.0) / 4.0)
    );

    // 5. Recency Bonus: exp(-days_inactive / 14)
    const deltaDays = Math.max(
      0.0,
      (Date.now() - new Date(candidate.last_active).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const recencyScore = Math.exp(-deltaDays / 14.0);

    // Composite Total Score
    const totalScore =
      this.weights.w1 * overlapScore +
      this.weights.w2 * levelCompat +
      this.weights.w3 * mutualBonus +
      this.weights.w4 * ratingScore +
      this.weights.w5 * recencyScore;

    return {
      candidate,
      totalScore: Math.round(totalScore * 1000) / 10, // Percentage (e.g. 89.5%)
      normalizedScore: Math.round(totalScore * 100) / 100,
      breakdown: {
        overlapScore: Math.round(overlapScore * 100),
        levelCompat: Math.round(levelCompat * 100),
        isMutualSwap,
        mutualBonus: Math.round(mutualBonus * 100),
        ratingScore: Math.round(ratingScore * 100),
        recencyScore: Math.round(recencyScore * 100)
      },
      matchingSkills: {
        candTeaches: candidate.skills_have.filter((s) =>
          userWantIds.has(s.skill_id)
        ),
        userTeaches: targetUser.skills_have.filter((s) =>
          candWantIds.has(s.skill_id)
        )
      }
    };
  }

  /**
   * Find and rank all eligible matches for targetUser.
   */
  findMatches(targetUser) {
    const scoredCandidates = [];

    for (const candidate of this.store.users) {
      if (candidate.id === targetUser.id) continue;
      if (candidate.verified_status !== "VERIFIED") continue;

      const scored = this.scoreCandidate(candidate, targetUser);
      if (scored && scored.totalScore > 0) {
        scoredCandidates.push(scored);
      }
    }

    // Sort Descending by totalScore
    scoredCandidates.sort((a, b) => b.totalScore - a.totalScore);
    return scoredCandidates;
  }
}

window.matchmaker = new MatchmakingEngine(window.store);
