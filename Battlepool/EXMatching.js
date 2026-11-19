// 対戦相手のプール「EXMatching（写し）」（AIRandomDicesim 5.0.1 で書き出し）
// Battlepool フォルダに置き、Battlepool/index.js の RD_POOL_FILES に並べると、開いたときに読み込まれます
RD.definePool("my_pool_copy", {
  "format": "rd-battle-pool",
  "formatVersion": 1,
  "id": "my_pool_copy",
  "name": "EXMatching",
  "desc": "",
  "entries": [
    {
      "name": "月太陽ロイヤル標準",
      "weight": 1,
      "ai": "moonsun_royal",
      "aiOptions": {
        "aiSpeed": 0.3,
        "royalAttack": true,
        "royalFromWave": 5,
        "royalStartMax": 45,
        "royalStartMin": 15,
        "royalStartSummons": 10,
        "royalStopSummons": 5,
        "oppFrontLine": 3.5,
        "royalSummon": true,
        "dSkip": 5,
        "dWindow": 5,
        "stopPastPos": 8.5,
        "reachCheck": true,
        "normalSpeed": 0.6,
        "knightRoyal": true,
        "knightRoyalLeft": 5,
        "knightRoyalMaxFront": 8.5,
        "repairJokerFallback": true,
        "starIdleUntil": {
          "6.0.5": 10,
          "6.5.0": 8
        },
        "oppMoonsunBoth": true,
        "starGuardOnly": true,
        "starStopsBuild": true,
        "moonAdjMin": 3,
        "sun7MergeWave": 6,
        "sun7Summons": 5,
        "sunIdleFromWave": 3,
        "w12GrowthAlways": true,
        "w12SpFix": true,
        "sunIdleFix": true,
        "prepLine": 6,
        "earlyLine": 8.5,
        "corner1": 3.5,
        "w1GoLeft": 55,
        "w2Spare": 3,
        "tsumiLimit": 5,
        "horizon": 10,
        "leonIdleKill": 2,
        "knightEatKill": 3,
        "puReserve": 0,
        "freePuGoal": {
          "shield": 5,
          "blizzard": 3
        },
        "growthW": 2.5,
        "keepJokers": 2,
        "growthFirst": true,
        "resumeGap": 0,
        "weakWave": 5,
        "resumeLine": 3.5,
        "weakMargin": 1,
        "capMinTime": 3,
        "startSummons": 10,
        "startWave": 3,
        "keepSummons": 5,
        "pairFallback": "copy",
        "pairUseReserved": false,
        "pairOnlyFull": true,
        "w12GrowthCopy": true,
        "dangerRelax": true,
        "idleRepair": false,
        "starSunMin": 3,
        "topSunMode": "potential",
        "fpMoonGuard": false,
        "growthMergeLine": 8.5,
        "noBuildLeft": 15,
        "activateLeft": 10,
        "jokerLast": true,
        "repairMode": "simple",
        "lowSummons": 5,
        "sevenTarget": false,
        "moonNeedsUse": false,
        "simpleDangerOld": true,
        "startOnce": false,
        "summonHyst": true,
        "over7": false,
        "highJokerGrowth": 4,
        "sunWaitFix": true,
        "knightRules": true,
        "pairMaxUrg": 1
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "moon",
        "sun",
        "royal",
        "growth",
        "joker"
      ],
      "cls": {
        "moon": 13,
        "sun": 12,
        "royal": 12,
        "growth": 12,
        "joker": 12
      },
      "startLv": {
        "moon": 1,
        "sun": 1,
        "royal": 1,
        "growth": 1,
        "joker": 1
      },
      "traits": {},
      "cd": 3000,
      "field": "plasma",
      "fieldLv": 20
    },
    {
      "name": "月太陽盾",
      "weight": 1,
      "ai": "moonsun",
      "aiOptions": {
        "prepLine": 6,
        "earlyLine": 8.5,
        "corner1": 3.5,
        "w1GoLeft": 55,
        "w2Spare": 3,
        "tsumiLimit": 4,
        "horizon": 10,
        "leonIdleKill": 2,
        "knightEatKill": 3,
        "puReserve": 0,
        "freePuGoal": {
          "shield": 5,
          "blizzard": 3
        },
        "growthW": 2.5,
        "keepJokers": 2,
        "growthFirst": true,
        "resumeGap": 0,
        "weakWave": 5,
        "resumeLine": 3.5,
        "weakMargin": 1,
        "capMinTime": 3,
        "startSummons": 10,
        "startWave": 3,
        "keepSummons": 5,
        "pairFallback": "copy",
        "pairUseReserved": false,
        "pairOnlyFull": true,
        "w12GrowthCopy": true,
        "dangerRelax": true,
        "idleRepair": false,
        "starSunMin": 3,
        "topSunMode": "potential",
        "fpMoonGuard": false,
        "growthMergeLine": 8.5,
        "noBuildLeft": 15,
        "activateLeft": 10,
        "jokerLast": true,
        "repairMode": "simple",
        "lowSummons": 5,
        "sevenTarget": false,
        "moonNeedsUse": false,
        "simpleDangerOld": true,
        "startOnce": false,
        "summonHyst": true,
        "over7": false,
        "highJokerGrowth": 4,
        "sunWaitFix": true,
        "knightRules": true,
        "pairMaxUrg": 1
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "moon",
        "sun",
        "shield",
        "growth",
        "joker"
      ],
      "cls": {
        "moon": 13,
        "sun": 12,
        "shield": 12,
        "growth": 12,
        "joker": 12
      },
      "startLv": {
        "moon": 1,
        "sun": 1,
        "shield": 1,
        "growth": 1,
        "joker": 1
      },
      "traits": {},
      "cd": 3000,
      "field": "plasma",
      "fieldLv": 20
    },
    {
      "name": "月太陽吹雪",
      "weight": 0.5,
      "ai": "moonsun",
      "aiOptions": {
        "prepLine": 6,
        "earlyLine": 8.5,
        "corner1": 3.5,
        "w1GoLeft": 55,
        "w2Spare": 3,
        "tsumiLimit": 4,
        "horizon": 10,
        "leonIdleKill": 2,
        "knightEatKill": 3,
        "puReserve": 0,
        "freePuGoal": {
          "shield": 5,
          "blizzard": 3
        },
        "growthW": 2.5,
        "keepJokers": 2,
        "growthFirst": true,
        "resumeGap": 0,
        "weakWave": 5,
        "resumeLine": 3.5,
        "weakMargin": 1,
        "capMinTime": 3,
        "startSummons": 10,
        "startWave": 3,
        "keepSummons": 5,
        "pairFallback": "copy",
        "pairUseReserved": false,
        "pairOnlyFull": true,
        "w12GrowthCopy": true,
        "dangerRelax": true,
        "idleRepair": false,
        "starSunMin": 3,
        "topSunMode": "potential",
        "fpMoonGuard": false,
        "growthMergeLine": 8.5,
        "noBuildLeft": 15,
        "activateLeft": 10,
        "jokerLast": true,
        "repairMode": "simple",
        "lowSummons": 5,
        "sevenTarget": false,
        "moonNeedsUse": false,
        "simpleDangerOld": true,
        "startOnce": false,
        "summonHyst": true,
        "over7": false,
        "highJokerGrowth": 4,
        "sunWaitFix": true,
        "knightRules": true,
        "pairMaxUrg": 1
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "moon",
        "sun",
        "blizzard",
        "growth",
        "joker"
      ],
      "cls": {
        "moon": 13,
        "sun": 12,
        "blizzard": 12,
        "growth": 12,
        "joker": 12
      },
      "startLv": {
        "moon": 1,
        "sun": 1,
        "blizzard": 1,
        "growth": 1,
        "joker": 1
      },
      "traits": {},
      "cd": 3000,
      "field": "journal",
      "fieldLv": 20
    },
    {
      "name": "月太陽スコ",
      "weight": 0.1,
      "ai": "moonsun",
      "aiOptions": {
        "prepLine": 6,
        "earlyLine": 8.5,
        "corner1": 3.5,
        "w1GoLeft": 55,
        "w2Spare": 3,
        "tsumiLimit": 4,
        "horizon": 10,
        "leonIdleKill": 2,
        "knightEatKill": 3,
        "puReserve": 0,
        "freePuGoal": {
          "shield": 5,
          "blizzard": 3
        },
        "growthW": 2.5,
        "keepJokers": 2,
        "growthFirst": true,
        "resumeGap": 0,
        "weakWave": 5,
        "resumeLine": 3.5,
        "weakMargin": 1,
        "capMinTime": 3,
        "startSummons": 10,
        "startWave": 3,
        "keepSummons": 5,
        "pairFallback": "copy",
        "pairUseReserved": false,
        "pairOnlyFull": true,
        "w12GrowthCopy": true,
        "dangerRelax": true,
        "idleRepair": false,
        "starSunMin": 3,
        "topSunMode": "potential",
        "fpMoonGuard": false,
        "growthMergeLine": 8.5,
        "noBuildLeft": 15,
        "activateLeft": 10,
        "jokerLast": true,
        "repairMode": "simple",
        "lowSummons": 5,
        "sevenTarget": false,
        "moonNeedsUse": false,
        "simpleDangerOld": true,
        "startOnce": false,
        "summonHyst": true,
        "over7": false,
        "highJokerGrowth": 4,
        "sunWaitFix": true,
        "knightRules": true,
        "pairMaxUrg": 1
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "moon",
        "sun",
        "scope",
        "growth",
        "joker"
      ],
      "cls": {
        "moon": 13,
        "sun": 12,
        "scope": 12,
        "growth": 12,
        "joker": 12
      },
      "startLv": {
        "moon": 1,
        "sun": 1,
        "scope": 1,
        "growth": 1,
        "joker": 1
      },
      "traits": {},
      "cd": 3000,
      "field": "journal",
      "fieldLv": 20
    },
    {
      "name": "月太陽剣",
      "weight": 0.1,
      "ai": "moonsun",
      "aiOptions": {
        "prepLine": 6,
        "earlyLine": 8.5,
        "corner1": 3.5,
        "w1GoLeft": 55,
        "w2Spare": 3,
        "tsumiLimit": 4,
        "horizon": 10,
        "leonIdleKill": 2,
        "knightEatKill": 3,
        "puReserve": 0,
        "freePuGoal": {
          "shield": 5,
          "blizzard": 3
        },
        "growthW": 2.5,
        "keepJokers": 2,
        "growthFirst": true,
        "resumeGap": 0,
        "weakWave": 5,
        "resumeLine": 3.5,
        "weakMargin": 1,
        "capMinTime": 3,
        "startSummons": 10,
        "startWave": 3,
        "keepSummons": 5,
        "pairFallback": "copy",
        "pairUseReserved": false,
        "pairOnlyFull": true,
        "w12GrowthCopy": true,
        "dangerRelax": true,
        "idleRepair": false,
        "starSunMin": 3,
        "topSunMode": "potential",
        "fpMoonGuard": false,
        "growthMergeLine": 8.5,
        "noBuildLeft": 15,
        "activateLeft": 10,
        "jokerLast": true,
        "repairMode": "simple",
        "lowSummons": 5,
        "sevenTarget": false,
        "moonNeedsUse": false,
        "simpleDangerOld": true,
        "startOnce": false,
        "summonHyst": true,
        "over7": false,
        "highJokerGrowth": 4,
        "sunWaitFix": true,
        "knightRules": true,
        "pairMaxUrg": 1
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "moon",
        "sun",
        "lightsword",
        "growth",
        "joker"
      ],
      "cls": {
        "moon": 13,
        "sun": 12,
        "lightsword": 13,
        "growth": 12,
        "joker": 12
      },
      "startLv": {
        "moon": 1,
        "sun": 1,
        "lightsword": 1,
        "growth": 1,
        "joker": 1
      },
      "traits": {},
      "cd": 3000,
      "field": "journal",
      "fieldLv": 20
    },
    {
      "name": "月太陽生贄",
      "weight": 0.5,
      "ai": "moonsun",
      "aiOptions": {
        "prepLine": 6,
        "earlyLine": 8.5,
        "corner1": 3.5,
        "w1GoLeft": 55,
        "w2Spare": 3,
        "tsumiLimit": 4,
        "horizon": 10,
        "leonIdleKill": 2,
        "knightEatKill": 3,
        "puReserve": 0,
        "freePuGoal": {
          "shield": 5,
          "blizzard": 3
        },
        "growthW": 2.5,
        "keepJokers": 2,
        "growthFirst": true,
        "resumeGap": 0,
        "weakWave": 5,
        "resumeLine": 3.5,
        "weakMargin": 1,
        "capMinTime": 3,
        "startSummons": 10,
        "startWave": 3,
        "keepSummons": 5,
        "pairFallback": "copy",
        "pairUseReserved": false,
        "pairOnlyFull": true,
        "w12GrowthCopy": true,
        "dangerRelax": true,
        "idleRepair": false,
        "starSunMin": 3,
        "topSunMode": "potential",
        "fpMoonGuard": false,
        "growthMergeLine": 8.5,
        "noBuildLeft": 15,
        "activateLeft": 10,
        "jokerLast": true,
        "repairMode": "simple",
        "lowSummons": 5,
        "sevenTarget": false,
        "moonNeedsUse": false,
        "simpleDangerOld": true,
        "startOnce": false,
        "summonHyst": true,
        "over7": false,
        "highJokerGrowth": 4,
        "sunWaitFix": true,
        "knightRules": true,
        "pairMaxUrg": 1
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "moon",
        "sun",
        "sacrifice",
        "growth",
        "joker"
      ],
      "cls": {
        "moon": 13,
        "sun": 12,
        "sacrifice": 15,
        "growth": 12,
        "joker": 12
      },
      "startLv": {
        "moon": 1,
        "sun": 1,
        "sacrifice": 1,
        "growth": 1,
        "joker": 1
      },
      "traits": {},
      "cd": 3000,
      "field": "journal",
      "fieldLv": 20
    },
    {
      "name": "月太陽台風",
      "weight": 0.1,
      "ai": "moonsun",
      "aiOptions": {
        "prepLine": 6,
        "earlyLine": 8.5,
        "corner1": 3.5,
        "w1GoLeft": 55,
        "w2Spare": 3,
        "tsumiLimit": 4,
        "horizon": 10,
        "leonIdleKill": 2,
        "knightEatKill": 3,
        "puReserve": 0,
        "freePuGoal": {
          "shield": 5,
          "blizzard": 3
        },
        "growthW": 2.5,
        "keepJokers": 2,
        "growthFirst": true,
        "resumeGap": 0,
        "weakWave": 5,
        "resumeLine": 3.5,
        "weakMargin": 1,
        "capMinTime": 3,
        "startSummons": 10,
        "startWave": 3,
        "keepSummons": 5,
        "pairFallback": "copy",
        "pairUseReserved": false,
        "pairOnlyFull": true,
        "w12GrowthCopy": true,
        "dangerRelax": true,
        "idleRepair": false,
        "starSunMin": 3,
        "topSunMode": "potential",
        "fpMoonGuard": false,
        "growthMergeLine": 8.5,
        "noBuildLeft": 15,
        "activateLeft": 10,
        "jokerLast": true,
        "repairMode": "simple",
        "lowSummons": 5,
        "sevenTarget": false,
        "moonNeedsUse": false,
        "simpleDangerOld": true,
        "startOnce": false,
        "summonHyst": true,
        "over7": false,
        "highJokerGrowth": 4,
        "sunWaitFix": true,
        "knightRules": true,
        "pairMaxUrg": 1
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "moon",
        "sun",
        "typhoon",
        "growth",
        "joker"
      ],
      "cls": {
        "moon": 13,
        "sun": 12,
        "typhoon": 12,
        "growth": 12,
        "joker": 12
      },
      "startLv": {
        "moon": 1,
        "sun": 1,
        "typhoon": 1,
        "growth": 1,
        "joker": 1
      },
      "traits": {},
      "cd": 3000,
      "field": "journal",
      "fieldLv": 20
    },
    {
      "name": "W成月太陽",
      "weight": 0.5,
      "ai": "moonsun",
      "aiOptions": {
        "prepLine": 6,
        "earlyLine": 8.5,
        "corner1": 3.5,
        "w1GoLeft": 55,
        "w2Spare": 3,
        "tsumiLimit": 4,
        "horizon": 10,
        "leonIdleKill": 2,
        "knightEatKill": 3,
        "puReserve": 0,
        "freePuGoal": {
          "shield": 5,
          "blizzard": 3
        },
        "growthW": 2.5,
        "keepJokers": 2,
        "growthFirst": true,
        "resumeGap": 0,
        "weakWave": 5,
        "resumeLine": 3.5,
        "weakMargin": 1,
        "capMinTime": 3,
        "startSummons": 10,
        "startWave": 3,
        "keepSummons": 5,
        "pairFallback": "copy",
        "pairUseReserved": false,
        "pairOnlyFull": true,
        "w12GrowthCopy": true,
        "dangerRelax": true,
        "idleRepair": false,
        "starSunMin": 3,
        "topSunMode": "potential",
        "fpMoonGuard": false,
        "growthMergeLine": 8.5,
        "noBuildLeft": 15,
        "activateLeft": 10,
        "jokerLast": true,
        "repairMode": "simple",
        "lowSummons": 5,
        "sevenTarget": false,
        "moonNeedsUse": false,
        "simpleDangerOld": true,
        "startOnce": false,
        "summonHyst": true,
        "over7": false,
        "highJokerGrowth": 4,
        "sunWaitFix": true,
        "knightRules": true,
        "pairMaxUrg": 1
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "moon",
        "sun",
        "brokengrowth",
        "growth",
        "joker"
      ],
      "cls": {
        "moon": 13,
        "sun": 12,
        "brokengrowth": 15,
        "growth": 12,
        "joker": 12
      },
      "startLv": {
        "moon": 1,
        "sun": 1,
        "brokengrowth": 1,
        "growth": 1,
        "joker": 1
      },
      "traits": {},
      "cd": 3000,
      "field": "plasma",
      "fieldLv": 20
    },
    {
      "name": "台風地獄核",
      "weight": 1,
      "ai": "typhoon_hell_nuke_basic",
      "aiOptions": {
        "nukeHold": 2.5,
        "midFromWave": 3,
        "bossNukeFromWave": 3,
        "bossNukeEarly": {
          "2": [
            "leon"
          ]
        },
        "leonStopWave": 1,
        "leonStopTyphoons": 3,
        "skillFirstWave": 20,
        "skillFirstBosses": [
          "leon"
        ],
        "prepStuckBosses": [
          "basilisk",
          "slime"
        ],
        "prepStuckFromWave": 3,
        "prepStuckMaxNukes": 6,
        "slimeIdleMaxSum": 10,
        "slimePrepSum": 10,
        "nukePipCap": 4,
        "pairFreeTH": 9,
        "normalFromWave": 3,
        "jokerTyphoonUntilWave": 2,
        "bossFullRatio": 0.8,
        "extraStuck": true,
        "corner1": 3.5,
        "corner2": 8.5
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "typhoon",
        "hell",
        "nuke",
        "adaptive",
        "joker"
      ],
      "cls": {
        "typhoon": 11,
        "hell": 11,
        "nuke": 11,
        "adaptive": 15,
        "joker": 11
      },
      "startLv": {
        "typhoon": 1,
        "hell": 1,
        "nuke": 1,
        "adaptive": 1,
        "joker": 1
      },
      "traits": {},
      "cd": 2500,
      "field": "journal",
      "fieldLv": 20
    },
    {
      "name": "炎フロ",
      "weight": 1,
      "ai": "fire_flow_royal_basic",
      "aiOptions": {
        "refuelBelow": 3,
        "refuelRatio2": 0.6,
        "idleRefuel": true,
        "shotCost": 0.02,
        "watch2": 15,
        "watch3": 10,
        "summonWhileWatching": true,
        "critSumMin1": 2,
        "critSumMin2": 3,
        "critToMax": 2,
        "minFireToMerge": 4,
        "centerProgress": 0.5,
        "flowLv2W": 3,
        "flowLv3W": 4,
        "flowLvMax": 5,
        "saveForPU": true,
        "jokerGrowthAlways": true,
        "jokerGrowthMaxPips": 2,
        "w1FlowFullMax": 1,
        "w2FlowMax": 1
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "fire",
        "flow",
        "royal",
        "growth",
        "joker"
      ],
      "cls": {
        "fire": 15,
        "flow": 12,
        "royal": 11,
        "growth": 11,
        "joker": 11
      },
      "startLv": {
        "fire": 1,
        "flow": 1,
        "royal": 1,
        "growth": 1,
        "joker": 1
      },
      "traits": {},
      "cd": 3000,
      "field": "paradise",
      "fieldLv": 20
    },
    {
      "name": "炎フロ特化",
      "weight": 1,
      "ai": "fire_flow_flowspec",
      "aiOptions": {
        "refuelBelow": 3,
        "refuelRatio2": 0.6,
        "idleRefuel": true,
        "shotCost": 0.02,
        "critToMax": 2,
        "critFireMin": 2,
        "minFireToMerge": 4,
        "flowSumLv2": 5,
        "flowSumLv3": 10,
        "corner2": 8.5,
        "w1KeepRoyalMin": 3,
        "smallJokerMax": 2,
        "lateLeft": 45,
        "centerProgress": 0.5,
        "flowLv3W": 4,
        "stuckLvMax": 5,
        "royalPairFromWave": 4,
        "saveForPU": true
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "fire",
        "flow",
        "royal",
        "growth",
        "joker"
      ],
      "cls": {
        "fire": 15,
        "flow": 12,
        "royal": 11,
        "growth": 11,
        "joker": 11
      },
      "startLv": {
        "fire": 1,
        "flow": 1,
        "royal": 1,
        "growth": 1,
        "joker": 1
      },
      "traits": {},
      "cd": 3000,
      "field": "paradise",
      "fieldLv": 20
    },
    {
      "name": "懸賞金暗殺",
      "weight": 1,
      "ai": "bounty_assassin",
      "aiOptions": {
        "earlyCost": 100,
        "adaptiveMoves": true,
        "sacMinSum": 4,
        "sacLv": 2,
        "puFromWave": 2
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "sacrifice",
        "bounty",
        "assassin",
        "adaptive",
        "joker"
      ],
      "cls": {
        "sacrifice": 15,
        "bounty": 15,
        "assassin": 11,
        "adaptive": 15,
        "joker": 11
      },
      "startLv": {
        "sacrifice": 1,
        "bounty": 1,
        "assassin": 1,
        "adaptive": 1,
        "joker": 1
      },
      "traits": {},
      "cd": 2500,
      "field": "prism",
      "fieldLv": 20
    },
    {
      "name": "航行スココン",
      "weight": 1,
      "ai": "scopecombo_basic",
      "aiOptions": {
        "puPlan": [
          [
            2,
            "scope",
            3
          ],
          [
            4,
            "scope",
            5
          ],
          [
            4,
            "combo",
            3
          ],
          [
            5,
            "combo",
            5
          ]
        ],
        "protectInComboCombo": true,
        "fullOnlyFromWave": 2,
        "highPips": 5,
        "lastComboPips": 2,
        "lossFromWave": 6,
        "lossRatio": 0.3,
        "stuckRules": true
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "scope",
        "combo",
        "summon",
        "adaptive",
        "joker"
      ],
      "cls": {
        "scope": 12,
        "combo": 13,
        "summon": 12,
        "adaptive": 15,
        "joker": 12
      },
      "startLv": {
        "scope": 1,
        "combo": 1,
        "summon": 1,
        "adaptive": 1,
        "joker": 1
      },
      "traits": {},
      "cd": 3000,
      "field": "journal",
      "fieldLv": 20
    },
    {
      "name": "陰ロイ",
      "weight": 1,
      "ai": "yinyang_royal",
      "aiOptions": {
        "critOrder": null,
        "clearMaxPips": 1,
        "switchMergeMin": 3,
        "feedBeforeClear": true,
        "feedAfterHarmony": true,
        "lastResort": true,
        "breakMinTimeLeft": 10,
        "royalTiming": "D",
        "royalNoAttackUntilWave": 5,
        "earlyJamRoyal": "preHarmony",
        "dFromWave": 6,
        "reachCheck": true,
        "normalSpeed": 0.6,
        "dSkip": 5,
        "dWindow": 5,
        "stopPastPos": 8.5,
        "dAggressive": 6,
        "royalCondition": "fromWave",
        "royalFromWave": 4,
        "puTargetLv": 5,
        "lineSink": false,
        "royalKeep": 1,
        "nutrientPair": true,
        "jokerRoyal": true,
        "critTarget": 5,
        "switchKeep": 1,
        "lineSinkLast": true,
        "preJokerEmptyW": 0.4,
        "preSort": true,
        "diceStats": {
          "yinyang": {
            "atk": [
              50,
              10,
              20
            ],
            "spd": [
              1,
              0
            ]
          },
          "royal": {
            "atk": [
              50,
              20,
              20
            ],
            "spd": [
              1,
              0
            ]
          },
          "switch": {
            "atk": [
              30,
              10,
              20
            ],
            "spd": [
              0.7,
              -0.02
            ]
          },
          "nutrient": {
            "atk": [
              10,
              10,
              10
            ],
            "spd": [
              1.5,
              0
            ]
          },
          "joker": {
            "atk": [
              20,
              5,
              10
            ],
            "spd": [
              1,
              0
            ]
          }
        },
        "leonPrep": true,
        "leonLateSec": 10,
        "leonMaxSummons": 7,
        "earlyFeed": true,
        "lateFromWave": 6,
        "jamBreak": false,
        "pierce": {
          "1": [
            1,
            2,
            3,
            3,
            4,
            6,
            6
          ],
          "2": [
            1,
            1,
            2,
            3,
            4,
            5,
            6,
            7
          ],
          "3": [
            1,
            1,
            2,
            3,
            4,
            4,
            5,
            6,
            6
          ],
          "4": [
            1,
            1,
            2,
            2,
            3,
            3,
            5,
            5,
            6,
            7
          ],
          "5": [
            1,
            1,
            2,
            2,
            3,
            3,
            4,
            5,
            6,
            6,
            7
          ]
        }
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "yinyang",
        "royal",
        "switch",
        "nutrient",
        "joker"
      ],
      "cls": {
        "yinyang": 11,
        "royal": 11,
        "switch": 15,
        "nutrient": 11,
        "joker": 11
      },
      "startLv": {
        "yinyang": 1,
        "royal": 1,
        "switch": 1,
        "nutrient": 1,
        "joker": 1
      },
      "traits": {},
      "cd": 2500,
      "field": "paradise",
      "fieldLv": 20
    },
    {
      "name": "月太陽沈黙月太陽AI",
      "weight": 0.5,
      "ai": "moonsun",
      "aiOptions": {
        "prepLine": 6,
        "earlyLine": 8.5,
        "corner1": 3.5,
        "w1GoLeft": 55,
        "w2Spare": 3,
        "tsumiLimit": 4,
        "horizon": 10,
        "leonIdleKill": 2,
        "knightEatKill": 3,
        "puReserve": 0,
        "freePuGoal": {
          "shield": 5,
          "blizzard": 3
        },
        "growthW": 2.5,
        "keepJokers": 2,
        "growthFirst": true,
        "resumeGap": 0,
        "weakWave": 5,
        "resumeLine": 3.5,
        "weakMargin": 1,
        "capMinTime": 3,
        "startSummons": 10,
        "startWave": 3,
        "keepSummons": 5,
        "pairFallback": "copy",
        "pairUseReserved": false,
        "pairOnlyFull": true,
        "w12GrowthCopy": true,
        "dangerRelax": true,
        "idleRepair": false,
        "starSunMin": 3,
        "topSunMode": "potential",
        "fpMoonGuard": false,
        "growthMergeLine": 8.5,
        "noBuildLeft": 15,
        "activateLeft": 10,
        "jokerLast": true,
        "repairMode": "simple",
        "lowSummons": 5,
        "sevenTarget": false,
        "moonNeedsUse": false,
        "simpleDangerOld": true,
        "startOnce": false,
        "summonHyst": true,
        "over7": false,
        "highJokerGrowth": 4,
        "sunWaitFix": true,
        "knightRules": true,
        "pairMaxUrg": 1
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "moon",
        "sun",
        "silence",
        "growth",
        "joker"
      ],
      "cls": {
        "moon": 13,
        "sun": 12,
        "silence": 12,
        "growth": 12,
        "joker": 12
      },
      "startLv": {
        "moon": 1,
        "sun": 1,
        "silence": 1,
        "growth": 1,
        "joker": 1
      },
      "traits": {},
      "cd": 3000,
      "field": "crystal",
      "fieldLv": 20
    },
    {
      "name": "月太陽ロイヤル月太陽AI",
      "weight": 0.5,
      "ai": "moonsun",
      "aiOptions": {
        "prepLine": 6,
        "earlyLine": 8.5,
        "corner1": 3.5,
        "w1GoLeft": 55,
        "w2Spare": 3,
        "tsumiLimit": 4,
        "horizon": 10,
        "leonIdleKill": 2,
        "knightEatKill": 3,
        "puReserve": 0,
        "freePuGoal": {
          "shield": 5,
          "blizzard": 3
        },
        "growthW": 2.5,
        "keepJokers": 2,
        "growthFirst": true,
        "resumeGap": 0,
        "weakWave": 5,
        "resumeLine": 3.5,
        "weakMargin": 1,
        "capMinTime": 3,
        "startSummons": 10,
        "startWave": 3,
        "keepSummons": 5,
        "pairFallback": "copy",
        "pairUseReserved": false,
        "pairOnlyFull": true,
        "w12GrowthCopy": true,
        "dangerRelax": true,
        "idleRepair": false,
        "starSunMin": 3,
        "topSunMode": "potential",
        "fpMoonGuard": false,
        "growthMergeLine": 8.5,
        "noBuildLeft": 15,
        "activateLeft": 10,
        "jokerLast": true,
        "repairMode": "simple",
        "lowSummons": 5,
        "sevenTarget": false,
        "moonNeedsUse": false,
        "simpleDangerOld": true,
        "startOnce": false,
        "summonHyst": true,
        "over7": false,
        "highJokerGrowth": 4,
        "sunWaitFix": true,
        "knightRules": true,
        "pairMaxUrg": 1
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "moon",
        "sun",
        "royal",
        "growth",
        "joker"
      ],
      "cls": {
        "moon": 13,
        "sun": 12,
        "royal": 12,
        "growth": 12,
        "joker": 12
      },
      "startLv": {
        "moon": 1,
        "sun": 1,
        "royal": 1,
        "growth": 1,
        "joker": 1
      },
      "traits": {},
      "cd": 3000,
      "field": "crystal",
      "fieldLv": 20
    },
    {
      "name": "月太陽フロー月太陽AI",
      "weight": 0.5,
      "ai": "moonsun",
      "aiOptions": {
        "prepLine": 6,
        "earlyLine": 8.5,
        "corner1": 3.5,
        "w1GoLeft": 55,
        "w2Spare": 3,
        "tsumiLimit": 4,
        "horizon": 10,
        "leonIdleKill": 2,
        "knightEatKill": 3,
        "puReserve": 0,
        "freePuGoal": {
          "shield": 5,
          "blizzard": 3
        },
        "growthW": 2.5,
        "keepJokers": 2,
        "growthFirst": true,
        "resumeGap": 0,
        "weakWave": 5,
        "resumeLine": 3.5,
        "weakMargin": 1,
        "capMinTime": 3,
        "startSummons": 10,
        "startWave": 3,
        "keepSummons": 5,
        "pairFallback": "copy",
        "pairUseReserved": false,
        "pairOnlyFull": true,
        "w12GrowthCopy": true,
        "dangerRelax": true,
        "idleRepair": false,
        "starSunMin": 3,
        "topSunMode": "potential",
        "fpMoonGuard": false,
        "growthMergeLine": 8.5,
        "noBuildLeft": 15,
        "activateLeft": 10,
        "jokerLast": true,
        "repairMode": "simple",
        "lowSummons": 5,
        "sevenTarget": false,
        "moonNeedsUse": false,
        "simpleDangerOld": true,
        "startOnce": false,
        "summonHyst": true,
        "over7": false,
        "highJokerGrowth": 4,
        "sunWaitFix": true,
        "knightRules": true,
        "pairMaxUrg": 1
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "moon",
        "sun",
        "flow",
        "growth",
        "joker"
      ],
      "cls": {
        "moon": 13,
        "sun": 12,
        "flow": 12,
        "growth": 12,
        "joker": 12
      },
      "startLv": {
        "moon": 1,
        "sun": 1,
        "flow": 1,
        "growth": 1,
        "joker": 1
      },
      "traits": {},
      "cd": 3000,
      "field": "plasma",
      "fieldLv": 20
    },
    {
      "name": "月太陽死月太陽AI",
      "weight": 0.5,
      "ai": "moonsun",
      "aiOptions": {
        "prepLine": 6,
        "earlyLine": 8.5,
        "corner1": 3.5,
        "w1GoLeft": 55,
        "w2Spare": 3,
        "tsumiLimit": 4,
        "horizon": 10,
        "leonIdleKill": 2,
        "knightEatKill": 3,
        "puReserve": 0,
        "freePuGoal": {
          "shield": 5,
          "blizzard": 3
        },
        "growthW": 2.5,
        "keepJokers": 2,
        "growthFirst": true,
        "resumeGap": 0,
        "weakWave": 5,
        "resumeLine": 3.5,
        "weakMargin": 1,
        "capMinTime": 3,
        "startSummons": 10,
        "startWave": 3,
        "keepSummons": 5,
        "pairFallback": "copy",
        "pairUseReserved": false,
        "pairOnlyFull": true,
        "w12GrowthCopy": true,
        "dangerRelax": true,
        "idleRepair": false,
        "starSunMin": 3,
        "topSunMode": "potential",
        "fpMoonGuard": false,
        "growthMergeLine": 8.5,
        "noBuildLeft": 15,
        "activateLeft": 10,
        "jokerLast": true,
        "repairMode": "simple",
        "lowSummons": 5,
        "sevenTarget": false,
        "moonNeedsUse": false,
        "simpleDangerOld": true,
        "startOnce": false,
        "summonHyst": true,
        "over7": false,
        "highJokerGrowth": 4,
        "sunWaitFix": true,
        "knightRules": true,
        "pairMaxUrg": 1
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "moon",
        "sun",
        "death",
        "growth",
        "joker"
      ],
      "cls": {
        "moon": 13,
        "sun": 12,
        "death": 15,
        "growth": 12,
        "joker": 12
      },
      "startLv": {
        "moon": 1,
        "sun": 1,
        "death": 1,
        "growth": 1,
        "joker": 1
      },
      "traits": {},
      "cd": 3000,
      "field": "plasma",
      "fieldLv": 20
    },
    {
      "name": "楽園スココン",
      "weight": 1,
      "ai": "scopecombo_paradise",
      "aiOptions": {
        "puPlan": [
          [
            2,
            "scope",
            3
          ],
          [
            4,
            "scope",
            5
          ],
          [
            4,
            "combo",
            3
          ],
          [
            5,
            "combo",
            5
          ]
        ],
        "eff": {
          "joker>combo": 1,
          "adaptive+combo": 0.9,
          "combo+combo": 0.7,
          "summon+summon": 0.6,
          "scope+scope": 0.5,
          "joker>summon": 0.4,
          "adaptive+summon": 0.35,
          "joker>scope": 0.3,
          "adaptive+scope": 0.25,
          "adaptive+adaptive": 0.15,
          "joker>adaptive": 0.1,
          "joker+joker": 0.1,
          "adaptive+joker": 0.05
        },
        "lowFirst": 0.01,
        "minScoreNotFull": 0,
        "Lref": 30,
        "emptyW": 3,
        "kL": 1,
        "kSeed": 0.8,
        "seedMaxPips": 4,
        "kJoker": 0.3,
        "kCrit": 0.1,
        "kW": 0.5,
        "kFire": 4,
        "kShort": 2,
        "marginHi": 2.5,
        "bossWeightMin": 0.3,
        "bossHpMul": 8,
        "bossKillFrac": 0.8,
        "bossNeedMul": {
          "leon": 0.5,
          "magician": 0.5
        },
        "sendFactor": 1,
        "inflowMul": 1.2,
        "eAssume": 6,
        "lookAhead": 20,
        "magLead": 60,
        "magLowPips": 2,
        "magLow": 0.6,
        "magPair": 0.6,
        "fullOnlyFromWave": 2,
        "notFullKeysEarly": [
          "joker>combo",
          "summon+summon",
          "scope+scope",
          "adaptive+combo",
          "adaptive+summon"
        ],
        "notFullKeys": [
          "joker>combo",
          "summon+summon"
        ]
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "scope",
        "combo",
        "summon",
        "adaptive",
        "joker"
      ],
      "cls": {
        "scope": 12,
        "combo": 11,
        "summon": 11,
        "adaptive": 15,
        "joker": 11
      },
      "startLv": {
        "scope": 1,
        "combo": 1,
        "summon": 1,
        "adaptive": 1,
        "joker": 1
      },
      "traits": {},
      "cd": 3500,
      "field": "paradise",
      "fieldLv": 20
    },
    {
      "name": "月死加熱",
      "weight": 1,
      "ai": "moondeathheat",
      "aiOptions": {
        "dangerLine": 8.5,
        "reserveLead": 15,
        "heatGap": 4,
        "pierceExtra": 1,
        "moonPrepLeft": 10,
        "hpMargin": 1.15,
        "travel": 0.3,
        "bossHpMul": 8,
        "knightNoStarEat": true,
        "leonEatTime": 4,
        "magicianHeal": 0.15,
        "tsumiStars": 5,
        "refStage": 6,
        "dpsLate": 0.3,
        "dpsBan": 0.5,
        "killLate": 0.5,
        "deathKeepPips": 2,
        "deathMaxLv": 5,
        "bossZako": 5,
        "starMaxDrop": 0.3,
        "freePu": {
          "moon": 5
        },
        "deathLvPips": [
          3,
          5,
          7,
          9
        ],
        "midFrom": 4,
        "midLane": 0.25,
        "midHpMul": 5,
        "midSpeed": 0.52,
        "ignoreDeath1Moon": 6,
        "noJGMergeUntil": 2,
        "moonJokerDangerOnly": true,
        "lowMoonMergeUntil": 3,
        "moonCareFrom": 4
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "moon",
        "death",
        "overheat",
        "growth",
        "joker"
      ],
      "cls": {
        "moon": 13,
        "death": 15,
        "overheat": 10,
        "growth": 11,
        "joker": 11
      },
      "startLv": {
        "moon": 1,
        "death": 1,
        "overheat": 1,
        "growth": 1,
        "joker": 1
      },
      "traits": {},
      "cd": 3500,
      "field": "plasma",
      "fieldLv": 20
    },
    {
      "name": "W成月死加熱",
      "weight": 1,
      "ai": "wgrowth_moondeathheat",
      "aiOptions": {
        "dangerLine": 8.5,
        "reserveLead": 15,
        "heatGap": 4,
        "pierceExtra": 1,
        "moonPrepLeft": 10,
        "hpMargin": 1.15,
        "travel": 0.3,
        "bossHpMul": 8,
        "knightNoStarEat": true,
        "leonEatTime": 4,
        "magicianHeal": 0.15,
        "tsumiStars": 5,
        "refStage": 6,
        "dpsLate": 0.3,
        "dpsBan": 0.5,
        "killLate": 0.5,
        "deathKeepPips": 2,
        "deathMaxLv": 5,
        "bossZako": 5,
        "starMaxDrop": 0.3,
        "freePu": {
          "moon": 5
        },
        "deathLvPips": [
          3,
          5,
          7,
          9
        ],
        "midFrom": 4,
        "midLane": 0.25,
        "midHpMul": 5,
        "midSpeed": 0.52,
        "ignoreDeath1Moon": 6,
        "noJGMergeUntil": 2,
        "lowMoonMergeUntil": 3,
        "moonCareFrom": 4
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "moon",
        "death",
        "overheat",
        "growth",
        "brokengrowth"
      ],
      "cls": {
        "moon": 13,
        "death": 15,
        "overheat": 10,
        "growth": 11,
        "brokengrowth": 15
      },
      "startLv": {
        "moon": 1,
        "death": 1,
        "overheat": 1,
        "growth": 1,
        "brokengrowth": 1
      },
      "traits": {},
      "cd": 3500,
      "field": "plasma",
      "fieldLv": 20
    },
    {
      "name": "ラ成月死加熱スイッチ",
      "weight": 1,
      "ai": "rgrowth_moon_switch_heat_death",
      "aiOptions": {
        "dangerLine": 8.5,
        "reserveLead": 15,
        "heatGap": 4,
        "pierceExtra": 1,
        "moonPrepLeft": 10,
        "hpMargin": 1.15,
        "travel": 0.3,
        "bossHpMul": 8,
        "knightNoStarEat": true,
        "leonEatTime": 4,
        "magicianHeal": 0.15,
        "tsumiStars": 5,
        "refStage": 6,
        "dpsLate": 0.3,
        "dpsBan": 0.5,
        "killLate": 0.5,
        "deathKeepPips": 2,
        "deathMaxLv": 5,
        "bossZako": 5,
        "starMaxDrop": 0.3,
        "freePu": {
          "moon": 5
        },
        "deathLvPips": [
          3,
          5,
          7,
          9
        ],
        "midFrom": 4,
        "midLane": 0.25,
        "midHpMul": 5,
        "midSpeed": 0.52,
        "ignoreDeath1Moon": 6,
        "noJGMergeUntil": 2,
        "lowMoonMergeUntil": 3,
        "moonCareFrom": 4,
        "assassinDodge": true,
        "swapGain": 0.02,
        "swapKillDrop": 0.1,
        "swapKillGain": 0.1
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "moon",
        "death",
        "overheat",
        "randomgrowth",
        "switch"
      ],
      "cls": {
        "moon": 13,
        "death": 15,
        "overheat": 10,
        "randomgrowth": 15,
        "switch": 15
      },
      "startLv": {
        "moon": 1,
        "death": 1,
        "overheat": 1,
        "randomgrowth": 1,
        "switch": 1
      },
      "traits": {},
      "cd": 3500,
      "field": "paradise",
      "fieldLv": 20
    },
    {
      "name": "楽園月スココン",
      "weight": 0.1,
      "ai": "moon_scopecombo",
      "aiOptions": {
        "puPlan": [
          [
            2,
            "scope",
            3
          ],
          [
            4,
            "scope",
            5
          ],
          [
            4,
            "combo",
            3
          ],
          [
            5,
            "combo",
            5
          ]
        ],
        "eff": {
          "joker>combo": 1,
          "adaptive+combo": 0.9,
          "combo+combo": 0.7,
          "moon+moon": 0.6,
          "scope+scope": 0.5,
          "adaptive+moon": 0.35,
          "joker>scope": 0.3,
          "adaptive+scope": 0.25,
          "adaptive+adaptive": 0.15,
          "joker>adaptive": 0.1,
          "joker+joker": 0.1,
          "adaptive+joker": 0.05
        },
        "moonCopy": {
          "splitPips": 4,
          "lo": 0.275,
          "hi": 0.325
        },
        "lowFirst": 0.01,
        "minScoreNotFull": 0,
        "Lref": 30,
        "emptyW": 3,
        "kL": 1,
        "kSeed": 0.8,
        "seedMaxPips": 4,
        "kJoker": 0.3,
        "kW": 0.5,
        "kCrit": 1,
        "critPen": [
          0,
          0,
          0,
          0.05,
          0.1,
          0.2,
          1.5,
          3
        ],
        "kWMag": 4,
        "kTok": 1,
        "tokJoker": 1.5,
        "tokAdaptive": 0.7,
        "critMaxPips": 7,
        "critOpsOffWave": 10,
        "kFire": 4,
        "kShort": 2,
        "marginHi": 2.5,
        "bossWeightMin": 0.3,
        "bossHpMul": 8,
        "bossKillFrac": 0.8,
        "bossNeedMul": {
          "leon": 0.5,
          "magician": 0.5
        },
        "sendFactor": 1,
        "inflowMul": 1.2,
        "eAssume": 6,
        "lookAhead": 20,
        "magLead": 15,
        "magLowPips": 2,
        "magLow": 0.6,
        "magPair": 0.6,
        "zakoOk": 1.5,
        "bossOk": 1.5,
        "leonLead": 15,
        "leonStopFromWave": 5,
        "kLeon1": 1.5,
        "combo1UseAdaptive": true,
        "leonForceToWave": 2,
        "magHoldFirstMeteor": true,
        "kCritOut": 1,
        "knightBossMul": 2,
        "knightActual": 0.1,
        "seed1Mul": 1.5,
        "joker1Pen": 0.4,
        "jokerToAdaptivePen": 5,
        "critComboMinPips": 3,
        "critComboPen": 0.8,
        "critComboScope": 0.25,
        "critRelaxW": 64,
        "magNoEscape": true,
        "moonActiveMul": 1.03,
        "corner1": 3.5,
        "corner2": 8.5,
        "freezeFromWave": 4,
        "freezeMoonPips": 4,
        "moonPuPips": 5,
        "moonPuLv": 5,
        "freezeAllowPu": true,
        "bossFreeze": true,
        "fullOnlyFromWave": 2,
        "notFullKeysEarly": [
          "joker>combo",
          "scope+scope",
          "adaptive+combo"
        ],
        "notFullKeys": [
          "joker>combo"
        ]
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "scope",
        "combo",
        "moon",
        "adaptive",
        "joker"
      ],
      "cls": {
        "scope": 12,
        "combo": 11,
        "moon": 13,
        "adaptive": 15,
        "joker": 11
      },
      "startLv": {
        "scope": 1,
        "combo": 1,
        "moon": 1,
        "adaptive": 1,
        "joker": 1
      },
      "traits": {},
      "cd": 3500,
      "field": "paradise",
      "fieldLv": 20
    },
    {
      "name": "楽園スイコン",
      "weight": 0.1,
      "ai": "switchcombo",
      "aiOptions": {
        "puPlan": [
          [
            2,
            "scope",
            3
          ],
          [
            4,
            "scope",
            5
          ],
          [
            4,
            "combo",
            3
          ],
          [
            5,
            "combo",
            5
          ]
        ],
        "eff": {
          "joker>combo": 1,
          "adaptive+combo": 0.9,
          "combo+combo": 0.7,
          "switch+switch": 0.6,
          "scope+scope": 0.5,
          "joker>scope": 0.3,
          "adaptive+scope": 0.25,
          "adaptive+switch": 0.2,
          "joker>switch": 0.2,
          "adaptive+adaptive": 0.15,
          "joker>adaptive": 0.1,
          "joker+joker": 0.1,
          "adaptive+joker": 0.05
        },
        "lowFirst": 0.01,
        "minScoreNotFull": 0,
        "Lref": 30,
        "emptyW": 3,
        "kL": 1,
        "kSeed": 0.8,
        "seedMaxPips": 4,
        "kJoker": 0.3,
        "kW": 0.5,
        "kCrit": 1,
        "critPen": [
          0,
          0,
          0,
          0.05,
          0.1,
          0.2,
          1.5,
          3
        ],
        "kWMag": 4,
        "kTok": 1,
        "tokJoker": 1.5,
        "tokAdaptive": 0.7,
        "critMaxPips": 7,
        "kFire": 4,
        "kShort": 2,
        "marginHi": 2.5,
        "bossWeightMin": 0.3,
        "bossHpMul": 8,
        "bossKillFrac": 0.8,
        "bossNeedMul": {
          "leon": 0.5,
          "magician": 0.5
        },
        "sendFactor": 1,
        "inflowMul": 1.2,
        "eAssume": 6,
        "lookAhead": 20,
        "magLead": 15,
        "magLowPips": 2,
        "magLow": 0.6,
        "magPair": 0.6,
        "zakoOk": 1.5,
        "bossOk": 1.5,
        "leonLead": 15,
        "leonStopFromWave": 5,
        "kLeon1": 1.5,
        "combo1UseAdaptive": true,
        "leonForceToWave": 2,
        "magHoldFirstMeteor": true,
        "kCritOut": 1,
        "knightBossMul": 2,
        "knightActual": 0.1,
        "seed1Mul": 1.5,
        "joker1Pen": 0.4,
        "jokerToAdaptivePen": 5,
        "critComboMinPips": 3,
        "critComboPen": 0.8,
        "critComboScope": 0.25,
        "critRelaxW": 64,
        "magNoEscape": true,
        "fullOnlyFromWave": 2,
        "notFullKeysEarly": [
          "joker>combo",
          "scope+scope",
          "adaptive+combo"
        ],
        "notFullKeys": [
          "joker>combo"
        ],
        "w1NoSwitchMerge": true,
        "w1CritSwitch": true,
        "assassinDodge": true,
        "meteorSwap": true,
        "hackSwap": true,
        "fireSwap": true,
        "swapGain": 0.02,
        "antiAssassin": {
          "interval": 0.1,
          "actInterval": 0.1,
          "dragTime": 0.1
        }
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "scope",
        "combo",
        "switch",
        "adaptive",
        "joker"
      ],
      "cls": {
        "scope": 12,
        "combo": 11,
        "switch": 15,
        "adaptive": 15,
        "joker": 11
      },
      "startLv": {
        "scope": 1,
        "combo": 1,
        "switch": 1,
        "adaptive": 1,
        "joker": 1
      },
      "traits": {},
      "cd": 3500,
      "field": "paradise",
      "fieldLv": 20
    },
    {
      "name": "スピガン原子",
      "weight": 0.2,
      "ai": "atomblizzardbasic",
      "aiOptions": {
        "points": {
          "0": 20,
          "1": 15,
          "2": 10,
          "3": 8,
          "4": 8,
          "5": 15,
          "9": 4,
          "10": 10,
          "14": 2
        },
        "pointsLate": {
          "0": 20,
          "1": 15,
          "2": 15,
          "3": 15,
          "4": 20,
          "5": 15,
          "9": 10,
          "10": 10,
          "14": 8
        },
        "lateFrom": 6,
        "pipPow": 1.2,
        "outer7": [
          10,
          5,
          0,
          1,
          2,
          3,
          4
        ],
        "sandMul": 1.5,
        "hpRef": 1500,
        "fireWeight": 0.1,
        "hitsPerPoint": 0.28,
        "borderMin": 20,
        "bossBorder": {
          "slime": 3,
          "basilisk": 2.5,
          "magician": 1.15
        },
        "basiliskLeftBonus": 3,
        "earlyBorder": {
          "1": 0.4,
          "2": 0.4,
          "3": 0.5,
          "4": 0.6
        },
        "kappa": 0.3,
        "wAtom": 100,
        "wBliz": 40,
        "wFire": 15,
        "wGrowth": 15,
        "growthShort": 3,
        "wJoker": 2,
        "wPips": 0.5,
        "blizGoal": 0.5,
        "knightBliz": 2,
        "blizAtomFrom": 5,
        "blizA": 1,
        "blizB": 0.75,
        "blizRef": 0.8,
        "earlyReserveSummons": 3,
        "earlyUntil": 4,
        "fireUnit": 300,
        "firePerLv": 0.9,
        "fireIgnoreFrom": 4,
        "fireIgnorePips": 2,
        "fireOuterMul": 0.5,
        "topFireMul": 1.3,
        "hackPen": 30,
        "pip7Pen": 25,
        "jgMergePen": 30,
        "jgMergeMin": 40,
        "forceGrowthUntil": 4,
        "jokerMergeMin": -2,
        "mergeMin": 0.5,
        "emptyDiscount": 0.8,
        "knightHpRatio": 0.25,
        "knightLook": 6,
        "w2FireLv": 2,
        "stuckPu": [
          [
            "atom",
            5
          ],
          [
            "blizzard",
            3
          ],
          [
            "fire",
            3
          ],
          [
            "fire",
            5
          ],
          [
            "blizzard",
            5
          ]
        ],
        "sinkSummons": 3,
        "sinkMaxPips": 2,
        "sinkTol": 15,
        "debug": 0
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "atom_650",
        "blizzard",
        "speedgun",
        "growth",
        "joker"
      ],
      "cls": {
        "atom_650": 11,
        "blizzard": 11,
        "speedgun": 15,
        "growth": 10,
        "joker": 11
      },
      "startLv": {
        "atom_650": 1,
        "blizzard": 1,
        "speedgun": 1,
        "growth": 1,
        "joker": 1
      },
      "traits": {},
      "cd": 3000,
      "field": "plasma",
      "fieldLv": 20
    },
    {
      "name": "剣原子",
      "weight": 0.5,
      "ai": "swordatom",
      "aiOptions": {
        "points": {
          "0": 20,
          "1": 15,
          "2": 10,
          "3": 8,
          "4": 8,
          "5": 15,
          "9": 4,
          "10": 10,
          "14": 2
        },
        "pointsLate": {
          "0": 20,
          "1": 15,
          "2": 15,
          "3": 15,
          "4": 20,
          "5": 15,
          "9": 10,
          "10": 10,
          "14": 8
        },
        "lateFrom": 6,
        "pipPow": 1.2,
        "outer7": [
          10,
          5,
          0,
          1,
          2,
          3,
          4
        ],
        "sandMul": 1.5,
        "hpRef": 1500,
        "fireWeight": 0.1,
        "hitsPerPoint": 0.28,
        "borderMin": 20,
        "bossBorder": {
          "slime": 3,
          "basilisk": 2.5,
          "magician": 1.15
        },
        "basiliskLeftBonus": 3,
        "earlyBorder": {
          "1": 0.4,
          "2": 0.4,
          "3": 0.5,
          "4": 0.6
        },
        "kappa": 0.3,
        "wAtom": 100,
        "wBliz": 40,
        "wFire": 15,
        "wGrowth": 15,
        "growthShort": 3,
        "wJoker": 2,
        "wPips": 0.5,
        "blizGoal": 0.5,
        "knightBliz": 2,
        "blizAtomFrom": 5,
        "blizA": 1,
        "blizB": 0.75,
        "blizRef": 0.8,
        "earlyReserveSummons": 3,
        "earlyUntil": 4,
        "fireUnit": 300,
        "firePerLv": 0.9,
        "fireIgnoreFrom": 4,
        "fireIgnorePips": 2,
        "fireOuterMul": 0.5,
        "topFireMul": 1.3,
        "hackPen": 30,
        "pip7Pen": 25,
        "jgMergePen": 30,
        "jgMergeMin": 40,
        "forceGrowthUntil": 4,
        "jokerMergeMin": -2,
        "mergeMin": 0.5,
        "emptyDiscount": 0.8,
        "knightHpRatio": 0.25,
        "knightLook": 6,
        "w2FireLv": 2,
        "stuckPu": [
          [
            "atom",
            5
          ],
          [
            "blizzard",
            3
          ],
          [
            "fire",
            3
          ],
          [
            "fire",
            5
          ],
          [
            "blizzard",
            5
          ]
        ],
        "sinkSummons": 3,
        "sinkMaxPips": 2,
        "sinkTol": 15,
        "celestialPen": 40,
        "celestialFrom": 6,
        "swordCopyBonus": 30,
        "swordJokerMin": 2,
        "debug": 0
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "atom_650",
        "blizzard",
        "lightsword",
        "growth",
        "joker"
      ],
      "cls": {
        "atom_650": 11,
        "blizzard": 11,
        "lightsword": 12,
        "growth": 10,
        "joker": 11
      },
      "startLv": {
        "atom_650": 1,
        "blizzard": 1,
        "lightsword": 1,
        "growth": 1,
        "joker": 1
      },
      "traits": {},
      "cd": 3000,
      "field": "void",
      "fieldLv": 20
    },
    {
      "name": "原子コンボ",
      "weight": 0.2,
      "ai": "atomcombo",
      "aiOptions": {
        "points": {
          "0": 20,
          "1": 15,
          "2": 10,
          "3": 8,
          "4": 8,
          "5": 15,
          "9": 4,
          "10": 10,
          "14": 2
        },
        "pointsLate": {
          "0": 20,
          "1": 15,
          "2": 15,
          "3": 15,
          "4": 20,
          "5": 15,
          "9": 10,
          "10": 10,
          "14": 8
        },
        "lateFrom": 6,
        "pipPow": 1.2,
        "outer7": [
          10,
          5,
          0,
          1,
          2,
          3,
          4
        ],
        "sandMul": 1.5,
        "hpRef": 1500,
        "fireWeight": 0.1,
        "hitsPerPoint": 0.28,
        "borderMin": 20,
        "bossBorder": {
          "slime": 3,
          "basilisk": 2.5,
          "magician": 1.15
        },
        "basiliskLeftBonus": 3,
        "earlyBorder": {
          "1": 0.4,
          "2": 0.4,
          "3": 0.5,
          "4": 0.6
        },
        "kappa": 0.3,
        "wAtom": 100,
        "wBliz": 40,
        "wFire": 15,
        "wGrowth": 5,
        "growthShort": 3,
        "wJoker": 2,
        "wPips": 0.5,
        "blizGoal": 0.5,
        "knightBliz": 2,
        "blizAtomFrom": 5,
        "blizA": 1,
        "blizB": 0.75,
        "blizRef": 0.8,
        "earlyReserveSummons": 3,
        "earlyUntil": 4,
        "fireUnit": 300,
        "firePerLv": 0.9,
        "fireIgnoreFrom": 4,
        "fireIgnorePips": 2,
        "fireOuterMul": 0.5,
        "topFireMul": 1.3,
        "hackPen": 30,
        "pip7Pen": 25,
        "jgMergePen": 30,
        "jgMergeMin": 40,
        "forceGrowthUntil": 0,
        "jokerMergeMin": -2,
        "mergeMin": 0.5,
        "emptyDiscount": 0.8,
        "knightHpRatio": 0.25,
        "knightLook": 6,
        "w2FireLv": 2,
        "stuckPu": [
          [
            "atom",
            5
          ],
          [
            "blizzard",
            3
          ],
          [
            "fire",
            3
          ],
          [
            "fire",
            5
          ],
          [
            "blizzard",
            5
          ]
        ],
        "sinkSummons": 3,
        "sinkMaxPips": 2,
        "sinkTol": 15,
        "comboCopyBase": 2,
        "otherCopyBase": 1,
        "critComboMin": 2,
        "critComboPen": 25,
        "critPipFrom": 4,
        "critPipPen": 8,
        "debug": 0
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "atom_650",
        "blizzard",
        "combo",
        "growth",
        "joker"
      ],
      "cls": {
        "atom_650": 11,
        "blizzard": 11,
        "combo": 12,
        "growth": 10,
        "joker": 11
      },
      "startLv": {
        "atom_650": 1,
        "blizzard": 1,
        "combo": 1,
        "growth": 1,
        "joker": 1
      },
      "traits": {},
      "cd": 3500,
      "field": "paradise",
      "fieldLv": 20
    },
    {
      "name": "月ロイ",
      "weight": 10,
      "ai": "moonsun_royal",
      "aiOptions": {
        "aiSpeed": 0.3,
        "royalAttack": true,
        "royalFromWave": 5,
        "royalStartMax": 45,
        "royalStartMin": 15,
        "royalStartSummons": 10,
        "royalStopSummons": 5,
        "oppFrontLine": 3.5,
        "royalSummon": true,
        "dSkip": 5,
        "dWindow": 5,
        "stopPastPos": 8.5,
        "reachCheck": true,
        "normalSpeed": 0.6,
        "knightRoyal": true,
        "knightRoyalLeft": 5,
        "knightRoyalMaxFront": 8.5,
        "repairJokerFallback": true,
        "starIdleUntil": {
          "6.0.5": 10,
          "6.5.0": 8
        },
        "oppMoonsunBoth": true,
        "starGuardOnly": true,
        "starStopsBuild": true,
        "moonAdjMin": 3,
        "sun7MergeWave": 6,
        "sun7Summons": 5,
        "sunIdleFromWave": 3,
        "w12GrowthAlways": true,
        "w12SpFix": true,
        "sunIdleFix": true,
        "prepLine": 6,
        "earlyLine": 8.5,
        "corner1": 3.5,
        "w1GoLeft": 55,
        "w2Spare": 3,
        "tsumiLimit": 5,
        "horizon": 10,
        "leonIdleKill": 2,
        "knightEatKill": 3,
        "puReserve": 0,
        "freePuGoal": {
          "shield": 5,
          "blizzard": 3
        },
        "growthW": 2.5,
        "keepJokers": 2,
        "growthFirst": true,
        "resumeGap": 0,
        "weakWave": 5,
        "resumeLine": 3.5,
        "weakMargin": 1,
        "capMinTime": 3,
        "startSummons": 10,
        "startWave": 3,
        "keepSummons": 5,
        "pairFallback": "copy",
        "pairUseReserved": false,
        "pairOnlyFull": true,
        "w12GrowthCopy": true,
        "dangerRelax": true,
        "idleRepair": false,
        "starSunMin": 3,
        "topSunMode": "potential",
        "fpMoonGuard": false,
        "growthMergeLine": 8.5,
        "noBuildLeft": 15,
        "activateLeft": 10,
        "jokerLast": true,
        "repairMode": "simple",
        "lowSummons": 5,
        "sevenTarget": false,
        "moonNeedsUse": false,
        "simpleDangerOld": true,
        "startOnce": false,
        "summonHyst": true,
        "over7": false,
        "highJokerGrowth": 4,
        "sunWaitFix": true,
        "knightRules": true,
        "pairMaxUrg": 1
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "moon",
        "sun",
        "royal",
        "growth",
        "joker"
      ],
      "cls": {
        "moon": 14,
        "sun": 12,
        "royal": 12,
        "growth": 12,
        "joker": 12
      },
      "startLv": {
        "moon": 1,
        "sun": 1,
        "royal": 1,
        "growth": 1,
        "joker": 1
      },
      "traits": {},
      "cd": 4000,
      "field": "plasma",
      "fieldLv": 20
    },
    {
      "name": "月盾",
      "weight": 4,
      "ai": "moonsun",
      "aiOptions": {
        "prepLine": 6,
        "earlyLine": 8.5,
        "corner1": 3.5,
        "w1GoLeft": 55,
        "w2Spare": 3,
        "tsumiLimit": 4,
        "horizon": 10,
        "leonIdleKill": 2,
        "knightEatKill": 3,
        "puReserve": 0,
        "freePuGoal": {
          "shield": 5,
          "blizzard": 3
        },
        "growthW": 2.5,
        "keepJokers": 2,
        "growthFirst": true,
        "resumeGap": 0,
        "weakWave": 5,
        "resumeLine": 3.5,
        "weakMargin": 1,
        "capMinTime": 3,
        "startSummons": 10,
        "startWave": 3,
        "keepSummons": 5,
        "pairFallback": "copy",
        "pairUseReserved": false,
        "pairOnlyFull": true,
        "w12GrowthCopy": true,
        "dangerRelax": true,
        "idleRepair": false,
        "starSunMin": 3,
        "topSunMode": "potential",
        "fpMoonGuard": false,
        "growthMergeLine": 8.5,
        "noBuildLeft": 15,
        "activateLeft": 10,
        "jokerLast": true,
        "repairMode": "simple",
        "lowSummons": 5,
        "sevenTarget": false,
        "moonNeedsUse": false,
        "simpleDangerOld": true,
        "startOnce": false,
        "summonHyst": true,
        "over7": false,
        "highJokerGrowth": 4,
        "sunWaitFix": true,
        "knightRules": true,
        "pairMaxUrg": 1
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "moon",
        "sun",
        "shield",
        "growth",
        "joker"
      ],
      "cls": {
        "moon": 14,
        "sun": 12,
        "shield": 13,
        "growth": 12,
        "joker": 12
      },
      "startLv": {
        "moon": 1,
        "sun": 1,
        "shield": 1,
        "growth": 1,
        "joker": 1
      },
      "traits": {},
      "cd": 4000,
      "field": "plasma",
      "fieldLv": 20
    },
    {
      "name": "W成月",
      "weight": 2,
      "ai": "moonsun",
      "aiOptions": {
        "prepLine": 6,
        "earlyLine": 8.5,
        "corner1": 3.5,
        "w1GoLeft": 55,
        "w2Spare": 3,
        "tsumiLimit": 4,
        "horizon": 10,
        "leonIdleKill": 2,
        "knightEatKill": 3,
        "puReserve": 0,
        "freePuGoal": {
          "shield": 5,
          "blizzard": 3
        },
        "growthW": 2.5,
        "keepJokers": 2,
        "growthFirst": true,
        "resumeGap": 0,
        "weakWave": 5,
        "resumeLine": 3.5,
        "weakMargin": 1,
        "capMinTime": 3,
        "startSummons": 10,
        "startWave": 3,
        "keepSummons": 5,
        "pairFallback": "copy",
        "pairUseReserved": false,
        "pairOnlyFull": true,
        "w12GrowthCopy": true,
        "dangerRelax": true,
        "idleRepair": false,
        "starSunMin": 3,
        "topSunMode": "potential",
        "fpMoonGuard": false,
        "growthMergeLine": 8.5,
        "noBuildLeft": 15,
        "activateLeft": 10,
        "jokerLast": true,
        "repairMode": "simple",
        "lowSummons": 5,
        "sevenTarget": false,
        "moonNeedsUse": false,
        "simpleDangerOld": true,
        "startOnce": false,
        "summonHyst": true,
        "over7": false,
        "highJokerGrowth": 4,
        "sunWaitFix": true,
        "knightRules": true,
        "pairMaxUrg": 1
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "moon",
        "sun",
        "brokengrowth",
        "growth",
        "joker"
      ],
      "cls": {
        "moon": 14,
        "sun": 12,
        "brokengrowth": 15,
        "growth": 12,
        "joker": 12
      },
      "startLv": {
        "moon": 1,
        "sun": 1,
        "brokengrowth": 1,
        "growth": 1,
        "joker": 1
      },
      "traits": {},
      "cd": 4000,
      "field": "plasma",
      "fieldLv": 20
    },
    {
      "name": "台風地獄核",
      "weight": 5,
      "ai": "typhoon_hell_nuke_basic",
      "aiOptions": {
        "nukeHold": 2.5,
        "midFromWave": 3,
        "bossNukeFromWave": 3,
        "bossNukeEarly": {
          "2": [
            "leon"
          ]
        },
        "leonStopWave": 1,
        "leonStopTyphoons": 3,
        "skillFirstWave": 20,
        "skillFirstBosses": [
          "leon"
        ],
        "prepStuckBosses": [
          "basilisk",
          "slime"
        ],
        "prepStuckFromWave": 3,
        "prepStuckMaxNukes": 6,
        "slimeIdleMaxSum": 10,
        "slimePrepSum": 10,
        "nukePipCap": 4,
        "pairFreeTH": 9,
        "normalFromWave": 3,
        "jokerTyphoonUntilWave": 2,
        "bossFullRatio": 0.8,
        "extraStuck": true,
        "corner1": 3.5,
        "corner2": 8.5
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "typhoon",
        "hell",
        "nuke",
        "adaptive",
        "joker"
      ],
      "cls": {
        "typhoon": 14,
        "hell": 11,
        "nuke": 11,
        "adaptive": 15,
        "joker": 11
      },
      "startLv": {
        "typhoon": 1,
        "hell": 1,
        "nuke": 1,
        "adaptive": 1,
        "joker": 1
      },
      "traits": {},
      "cd": 3500,
      "field": "journal",
      "fieldLv": 20
    },
    {
      "name": "炎フロ対面",
      "weight": 5,
      "ai": "fire_flow_flowspec",
      "aiOptions": {
        "refuelBelow": 3,
        "refuelRatio2": 0.6,
        "idleRefuel": true,
        "shotCost": 0.02,
        "critToMax": 2,
        "critFireMin": 2,
        "minFireToMerge": 4,
        "flowSumLv2": 5,
        "flowSumLv3": 10,
        "corner2": 8.5,
        "w1KeepRoyalMin": 3,
        "smallJokerMax": 2,
        "lateLeft": 45,
        "centerProgress": 0.5,
        "flowLv3W": 4,
        "stuckLvMax": 5,
        "royalPairFromWave": 4,
        "saveForPU": true
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "fire",
        "flow",
        "royal",
        "growth",
        "joker"
      ],
      "cls": {
        "fire": 15,
        "flow": 12,
        "royal": 11,
        "growth": 11,
        "joker": 11
      },
      "startLv": {
        "fire": 1,
        "flow": 1,
        "royal": 1,
        "growth": 1,
        "joker": 1
      },
      "traits": {},
      "cd": 4000,
      "field": "paradise",
      "fieldLv": 20
    },
    {
      "name": "懸賞金暗殺",
      "weight": 20,
      "ai": "bounty_assassin",
      "aiOptions": {
        "earlyCost": 100,
        "adaptiveMoves": true,
        "sacMinSum": 4,
        "sacLv": 2,
        "puFromWave": 2
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "sacrifice",
        "bounty",
        "assassin",
        "adaptive",
        "joker"
      ],
      "cls": {
        "sacrifice": 15,
        "bounty": 15,
        "assassin": 11,
        "adaptive": 15,
        "joker": 11
      },
      "startLv": {
        "sacrifice": 1,
        "bounty": 1,
        "assassin": 1,
        "adaptive": 1,
        "joker": 1
      },
      "traits": {},
      "cd": 2500,
      "field": "prism",
      "fieldLv": 20
    },
    {
      "name": "陰ロイ",
      "weight": 15,
      "ai": "yinyang_royal",
      "aiOptions": {
        "critOrder": null,
        "clearMaxPips": 1,
        "switchMergeMin": 3,
        "feedBeforeClear": true,
        "feedAfterHarmony": true,
        "lastResort": true,
        "breakMinTimeLeft": 10,
        "royalTiming": "D",
        "royalNoAttackUntilWave": 5,
        "earlyJamRoyal": "preHarmony",
        "dFromWave": 6,
        "reachCheck": true,
        "normalSpeed": 0.6,
        "dSkip": 5,
        "dWindow": 5,
        "stopPastPos": 8.5,
        "dAggressive": 6,
        "royalCondition": "fromWave",
        "royalFromWave": 4,
        "puTargetLv": 5,
        "lineSink": false,
        "royalKeep": 1,
        "nutrientPair": true,
        "jokerRoyal": true,
        "critTarget": 5,
        "switchKeep": 1,
        "lineSinkLast": true,
        "preJokerEmptyW": 0.4,
        "preSort": true,
        "diceStats": {
          "yinyang": {
            "atk": [
              50,
              10,
              20
            ],
            "spd": [
              1,
              0
            ]
          },
          "royal": {
            "atk": [
              50,
              20,
              20
            ],
            "spd": [
              1,
              0
            ]
          },
          "switch": {
            "atk": [
              30,
              10,
              20
            ],
            "spd": [
              0.7,
              -0.02
            ]
          },
          "nutrient": {
            "atk": [
              10,
              10,
              10
            ],
            "spd": [
              1.5,
              0
            ]
          },
          "joker": {
            "atk": [
              20,
              5,
              10
            ],
            "spd": [
              1,
              0
            ]
          }
        },
        "leonPrep": true,
        "leonLateSec": 10,
        "leonMaxSummons": 7,
        "earlyFeed": true,
        "lateFromWave": 6,
        "jamBreak": false,
        "pierce": {
          "1": [
            1,
            2,
            3,
            3,
            4,
            6,
            6
          ],
          "2": [
            1,
            1,
            2,
            3,
            4,
            5,
            6,
            7
          ],
          "3": [
            1,
            1,
            2,
            3,
            4,
            4,
            5,
            6,
            6
          ],
          "4": [
            1,
            1,
            2,
            2,
            3,
            3,
            5,
            5,
            6,
            7
          ],
          "5": [
            1,
            1,
            2,
            2,
            3,
            3,
            4,
            5,
            6,
            6,
            7
          ]
        }
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "yinyang",
        "royal",
        "switch",
        "nutrient",
        "joker"
      ],
      "cls": {
        "yinyang": 15,
        "royal": 11,
        "switch": 15,
        "nutrient": 11,
        "joker": 11
      },
      "startLv": {
        "yinyang": 1,
        "royal": 1,
        "switch": 1,
        "nutrient": 1,
        "joker": 1
      },
      "traits": {},
      "cd": 4000,
      "field": "paradise",
      "fieldLv": 20
    },
    {
      "name": "陰ロイ",
      "weight": 5,
      "ai": "yinyang_royal",
      "aiOptions": {
        "critOrder": null,
        "clearMaxPips": 1,
        "switchMergeMin": 3,
        "feedBeforeClear": true,
        "feedAfterHarmony": true,
        "lastResort": true,
        "breakMinTimeLeft": 10,
        "royalTiming": "D",
        "royalNoAttackUntilWave": 5,
        "earlyJamRoyal": "preHarmony",
        "dFromWave": 6,
        "reachCheck": true,
        "normalSpeed": 0.6,
        "dSkip": 5,
        "dWindow": 5,
        "stopPastPos": 8.5,
        "dAggressive": 6,
        "royalCondition": "fromWave",
        "royalFromWave": 4,
        "puTargetLv": 5,
        "lineSink": false,
        "royalKeep": 1,
        "nutrientPair": true,
        "jokerRoyal": true,
        "critTarget": 5,
        "switchKeep": 1,
        "lineSinkLast": true,
        "preJokerEmptyW": 0.4,
        "preSort": true,
        "diceStats": {
          "yinyang": {
            "atk": [
              50,
              10,
              20
            ],
            "spd": [
              1,
              0
            ]
          },
          "royal": {
            "atk": [
              50,
              20,
              20
            ],
            "spd": [
              1,
              0
            ]
          },
          "switch": {
            "atk": [
              30,
              10,
              20
            ],
            "spd": [
              0.7,
              -0.02
            ]
          },
          "nutrient": {
            "atk": [
              10,
              10,
              10
            ],
            "spd": [
              1.5,
              0
            ]
          },
          "joker": {
            "atk": [
              20,
              5,
              10
            ],
            "spd": [
              1,
              0
            ]
          }
        },
        "leonPrep": true,
        "leonLateSec": 10,
        "leonMaxSummons": 7,
        "earlyFeed": true,
        "lateFromWave": 6,
        "jamBreak": false,
        "pierce": {
          "1": [
            1,
            2,
            3,
            3,
            4,
            6,
            6
          ],
          "2": [
            1,
            1,
            2,
            3,
            4,
            5,
            6,
            7
          ],
          "3": [
            1,
            1,
            2,
            3,
            4,
            4,
            5,
            6,
            6
          ],
          "4": [
            1,
            1,
            2,
            2,
            3,
            3,
            5,
            5,
            6,
            7
          ],
          "5": [
            1,
            1,
            2,
            2,
            3,
            3,
            4,
            5,
            6,
            6,
            7
          ]
        }
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "yinyang_650",
        "royal",
        "switch",
        "nutrient",
        "joker"
      ],
      "cls": {
        "yinyang_650": 10,
        "royal": 11,
        "switch": 15,
        "nutrient": 11,
        "joker": 11
      },
      "startLv": {
        "yinyang_650": 1,
        "royal": 1,
        "switch": 1,
        "nutrient": 1,
        "joker": 1
      },
      "traits": {},
      "cd": 4000,
      "field": "paradise",
      "fieldLv": 20
    },
    {
      "name": "月太陽沈黙(妨害AI)",
      "weight": 1,
      "ai": "moonsun_disrupt_royal",
      "aiOptions": {
        "freeType": null,
        "aiSpeed": 0.3,
        "royalAttack": true,
        "royalFromWave": 5,
        "royalStartMax": 45,
        "royalStartMin": 15,
        "royalStartSummons": 10,
        "royalStopSummons": 5,
        "oppFrontLine": 3.5,
        "royalSummon": true,
        "dSkip": 5,
        "dWindow": 5,
        "stopPastPos": 8.5,
        "reachCheck": true,
        "normalSpeed": 0.6,
        "knightRoyal": true,
        "knightRoyalLeft": 5,
        "knightRoyalMaxFront": 8.5,
        "repairJokerFallback": true,
        "starIdleUntil": {
          "6.0.5": 10,
          "6.5.0": 8
        },
        "growthPairLine": 8.5,
        "oppMoonsunBoth": true,
        "oppMoonPipsMin": 5,
        "oppMoonPipsUntil": 19,
        "oppMoonSpdMin": 0.9,
        "starGuardOnly": true,
        "starStopsBuild": true,
        "moonAdjMin": 3,
        "sun7MergeWave": 6,
        "sun7Summons": 5,
        "sunIdleFromWave": 3,
        "w12GrowthAlways": true,
        "w12SpFix": true,
        "sunIdleFix": true,
        "prepLine": 6,
        "earlyLine": 8.5,
        "corner1": 3.5,
        "w1GoLeft": 55,
        "w2Spare": 3,
        "tsumiLimit": 5,
        "horizon": 10,
        "leonIdleKill": 2,
        "knightEatKill": 3,
        "puReserve": 0,
        "freePuGoal": {
          "shield": 5,
          "blizzard": 3
        },
        "growthW": 2.5,
        "keepJokers": 2,
        "growthFirst": true,
        "resumeGap": 0,
        "weakWave": 5,
        "resumeLine": 3.5,
        "weakMargin": 1,
        "capMinTime": 3,
        "startSummons": 10,
        "startWave": 3,
        "keepSummons": 5,
        "pairFallback": "copy",
        "pairUseReserved": false,
        "pairOnlyFull": true,
        "w12GrowthCopy": true,
        "dangerRelax": true,
        "idleRepair": false,
        "starSunMin": 3,
        "topSunMode": "potential",
        "fpMoonGuard": false,
        "growthMergeLine": 8.5,
        "noBuildLeft": 15,
        "activateLeft": 10,
        "jokerLast": true,
        "repairMode": "simple",
        "lowSummons": 5,
        "sevenTarget": false,
        "moonNeedsUse": false,
        "simpleDangerOld": true,
        "startOnce": false,
        "summonHyst": true,
        "over7": false,
        "highJokerGrowth": 4,
        "sunWaitFix": true,
        "knightRules": true,
        "pairMaxUrg": 1
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "moon",
        "sun",
        "silence",
        "growth",
        "joker"
      ],
      "cls": {
        "moon": 13,
        "sun": 12,
        "silence": 12,
        "growth": 12,
        "joker": 12
      },
      "startLv": {
        "moon": 1,
        "sun": 1,
        "silence": 1,
        "growth": 1,
        "joker": 1
      },
      "traits": {},
      "cd": 3000,
      "field": "prism",
      "fieldLv": 20
    },
    {
      "name": "祝福月太陽フロー",
      "weight": 5,
      "ai": "moonsun",
      "aiOptions": {
        "prepLine": 6,
        "earlyLine": 8.5,
        "corner1": 3.5,
        "w1GoLeft": 55,
        "w2Spare": 3,
        "tsumiLimit": 4,
        "horizon": 10,
        "leonIdleKill": 2,
        "knightEatKill": 3,
        "puReserve": 0,
        "freePuGoal": {
          "shield": 5,
          "blizzard": 3
        },
        "growthW": 2.5,
        "keepJokers": 2,
        "growthFirst": true,
        "resumeGap": 0,
        "weakWave": 5,
        "resumeLine": 3.5,
        "weakMargin": 1,
        "capMinTime": 3,
        "startSummons": 10,
        "startWave": 3,
        "keepSummons": 5,
        "pairFallback": "copy",
        "pairUseReserved": false,
        "pairOnlyFull": true,
        "w12GrowthCopy": true,
        "dangerRelax": true,
        "idleRepair": false,
        "starSunMin": 3,
        "topSunMode": "potential",
        "fpMoonGuard": false,
        "growthMergeLine": 8.5,
        "noBuildLeft": 15,
        "activateLeft": 10,
        "jokerLast": true,
        "repairMode": "simple",
        "lowSummons": 5,
        "sevenTarget": false,
        "moonNeedsUse": false,
        "simpleDangerOld": true,
        "startOnce": false,
        "summonHyst": true,
        "over7": false,
        "highJokerGrowth": 4,
        "sunWaitFix": true,
        "knightRules": true,
        "pairMaxUrg": 1
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "joker",
        "moon",
        "sun",
        "growth",
        "flow"
      ],
      "cls": {
        "joker": 11,
        "moon": 14,
        "sun": 11,
        "growth": 12,
        "flow": 14
      },
      "startLv": {
        "joker": 1,
        "moon": 1,
        "sun": 1,
        "growth": 1,
        "flow": 1
      },
      "traits": {},
      "cd": 4000,
      "field": "blessing",
      "fieldLv": 12
    },
    {
      "name": "祝福W成月太陽",
      "weight": 2,
      "ai": "moonsun",
      "aiOptions": {
        "prepLine": 6,
        "earlyLine": 8.5,
        "corner1": 3.5,
        "w1GoLeft": 55,
        "w2Spare": 3,
        "tsumiLimit": 4,
        "horizon": 10,
        "leonIdleKill": 2,
        "knightEatKill": 3,
        "puReserve": 0,
        "freePuGoal": {
          "shield": 5,
          "blizzard": 3
        },
        "growthW": 2.5,
        "keepJokers": 2,
        "growthFirst": true,
        "resumeGap": 0,
        "weakWave": 5,
        "resumeLine": 3.5,
        "weakMargin": 1,
        "capMinTime": 3,
        "startSummons": 10,
        "startWave": 3,
        "keepSummons": 5,
        "pairFallback": "copy",
        "pairUseReserved": false,
        "pairOnlyFull": true,
        "w12GrowthCopy": true,
        "dangerRelax": true,
        "idleRepair": false,
        "starSunMin": 3,
        "topSunMode": "potential",
        "fpMoonGuard": false,
        "growthMergeLine": 8.5,
        "noBuildLeft": 15,
        "activateLeft": 10,
        "jokerLast": true,
        "repairMode": "simple",
        "lowSummons": 5,
        "sevenTarget": false,
        "moonNeedsUse": false,
        "simpleDangerOld": true,
        "startOnce": false,
        "summonHyst": true,
        "over7": false,
        "highJokerGrowth": 4,
        "sunWaitFix": true,
        "knightRules": true,
        "pairMaxUrg": 1
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "joker",
        "moon",
        "sun",
        "growth",
        "brokengrowth"
      ],
      "cls": {
        "joker": 11,
        "moon": 14,
        "sun": 11,
        "growth": 12,
        "brokengrowth": 15
      },
      "startLv": {
        "joker": 1,
        "moon": 1,
        "sun": 1,
        "growth": 1,
        "brokengrowth": 1
      },
      "traits": {},
      "cd": 4000,
      "field": "blessing",
      "fieldLv": 12
    },
    {
      "name": "月太陽死月太陽AI",
      "weight": 2,
      "ai": "moonsun",
      "aiOptions": {
        "prepLine": 6,
        "earlyLine": 8.5,
        "corner1": 3.5,
        "w1GoLeft": 55,
        "w2Spare": 3,
        "tsumiLimit": 4,
        "horizon": 10,
        "leonIdleKill": 2,
        "knightEatKill": 3,
        "puReserve": 0,
        "freePuGoal": {
          "shield": 5,
          "blizzard": 3
        },
        "growthW": 2.5,
        "keepJokers": 2,
        "growthFirst": true,
        "resumeGap": 0,
        "weakWave": 5,
        "resumeLine": 3.5,
        "weakMargin": 1,
        "capMinTime": 3,
        "startSummons": 10,
        "startWave": 3,
        "keepSummons": 5,
        "pairFallback": "copy",
        "pairUseReserved": false,
        "pairOnlyFull": true,
        "w12GrowthCopy": true,
        "dangerRelax": true,
        "idleRepair": false,
        "starSunMin": 3,
        "topSunMode": "potential",
        "fpMoonGuard": false,
        "growthMergeLine": 8.5,
        "noBuildLeft": 15,
        "activateLeft": 10,
        "jokerLast": true,
        "repairMode": "simple",
        "lowSummons": 5,
        "sevenTarget": false,
        "moonNeedsUse": false,
        "simpleDangerOld": true,
        "startOnce": false,
        "summonHyst": true,
        "over7": false,
        "highJokerGrowth": 4,
        "sunWaitFix": true,
        "knightRules": true,
        "pairMaxUrg": 1
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "moon",
        "sun",
        "death",
        "growth",
        "joker"
      ],
      "cls": {
        "moon": 14,
        "sun": 12,
        "death": 15,
        "growth": 12,
        "joker": 12
      },
      "startLv": {
        "moon": 1,
        "sun": 1,
        "death": 1,
        "growth": 1,
        "joker": 1
      },
      "traits": {},
      "cd": 4000,
      "field": "crystal_665",
      "fieldLv": 20
    },
    {
      "name": "月死加熱",
      "weight": 5,
      "ai": "moondeathheat",
      "aiOptions": {
        "dangerLine": 8.5,
        "reserveLead": 15,
        "heatGap": 4,
        "pierceExtra": 1,
        "moonPrepLeft": 10,
        "hpMargin": 1.15,
        "travel": 0.3,
        "bossHpMul": 8,
        "knightNoStarEat": true,
        "leonEatTime": 4,
        "magicianHeal": 0.15,
        "tsumiStars": 5,
        "refStage": 6,
        "dpsLate": 0.3,
        "dpsBan": 0.5,
        "killLate": 0.5,
        "deathKeepPips": 2,
        "deathMaxLv": 5,
        "bossZako": 5,
        "starMaxDrop": 0.3,
        "freePu": {
          "moon": 5
        },
        "deathLvPips": [
          3,
          5,
          7,
          9
        ],
        "midFrom": 4,
        "midLane": 0.25,
        "midHpMul": 5,
        "midSpeed": 0.52,
        "ignoreDeath1Moon": 6,
        "noJGMergeUntil": 2,
        "moonJokerDangerOnly": true,
        "lowMoonMergeUntil": 3,
        "moonCareFrom": 4
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "moon",
        "death",
        "overheat",
        "growth",
        "joker"
      ],
      "cls": {
        "moon": 13,
        "death": 15,
        "overheat": 11,
        "growth": 11,
        "joker": 11
      },
      "startLv": {
        "moon": 1,
        "death": 1,
        "overheat": 1,
        "growth": 1,
        "joker": 1
      },
      "traits": {},
      "cd": 4000,
      "field": "plasma",
      "fieldLv": 20
    },
    {
      "name": "W成月死加熱",
      "weight": 5,
      "ai": "wgrowth_moondeathheat",
      "aiOptions": {
        "dangerLine": 8.5,
        "reserveLead": 15,
        "heatGap": 4,
        "pierceExtra": 1,
        "moonPrepLeft": 10,
        "hpMargin": 1.15,
        "travel": 0.3,
        "bossHpMul": 8,
        "knightNoStarEat": true,
        "leonEatTime": 4,
        "magicianHeal": 0.15,
        "tsumiStars": 5,
        "refStage": 6,
        "dpsLate": 0.3,
        "dpsBan": 0.5,
        "killLate": 0.5,
        "deathKeepPips": 2,
        "deathMaxLv": 5,
        "bossZako": 5,
        "starMaxDrop": 0.3,
        "freePu": {
          "moon": 5
        },
        "deathLvPips": [
          3,
          5,
          7,
          9
        ],
        "midFrom": 4,
        "midLane": 0.25,
        "midHpMul": 5,
        "midSpeed": 0.52,
        "ignoreDeath1Moon": 6,
        "noJGMergeUntil": 2,
        "lowMoonMergeUntil": 3,
        "moonCareFrom": 4
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "moon",
        "death",
        "overheat",
        "growth",
        "brokengrowth"
      ],
      "cls": {
        "moon": 13,
        "death": 15,
        "overheat": 10,
        "growth": 11,
        "brokengrowth": 15
      },
      "startLv": {
        "moon": 1,
        "death": 1,
        "overheat": 1,
        "growth": 1,
        "brokengrowth": 1
      },
      "traits": {},
      "cd": 4000,
      "field": "plasma",
      "fieldLv": 20
    },
    {
      "name": "ラ成月死加熱スイッチ",
      "weight": 4,
      "ai": "rgrowth_moon_switch_heat_death",
      "aiOptions": {
        "dangerLine": 8.5,
        "reserveLead": 15,
        "heatGap": 4,
        "pierceExtra": 1,
        "moonPrepLeft": 10,
        "hpMargin": 1.15,
        "travel": 0.3,
        "bossHpMul": 8,
        "knightNoStarEat": true,
        "leonEatTime": 4,
        "magicianHeal": 0.15,
        "tsumiStars": 5,
        "refStage": 6,
        "dpsLate": 0.3,
        "dpsBan": 0.5,
        "killLate": 0.5,
        "deathKeepPips": 2,
        "deathMaxLv": 5,
        "bossZako": 5,
        "starMaxDrop": 0.3,
        "freePu": {
          "moon": 5
        },
        "deathLvPips": [
          3,
          5,
          7,
          9
        ],
        "midFrom": 4,
        "midLane": 0.25,
        "midHpMul": 5,
        "midSpeed": 0.52,
        "ignoreDeath1Moon": 6,
        "noJGMergeUntil": 2,
        "lowMoonMergeUntil": 3,
        "moonCareFrom": 4,
        "assassinDodge": true,
        "swapGain": 0.02,
        "swapKillDrop": 0.1,
        "swapKillGain": 0.1
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "moon",
        "death",
        "overheat",
        "randomgrowth",
        "switch"
      ],
      "cls": {
        "moon": 13,
        "death": 15,
        "overheat": 10,
        "randomgrowth": 15,
        "switch": 15
      },
      "startLv": {
        "moon": 1,
        "death": 1,
        "overheat": 1,
        "randomgrowth": 1,
        "switch": 1
      },
      "traits": {},
      "cd": 4000,
      "field": "paradise",
      "fieldLv": 20
    },
    {
      "name": "祝福月スココン",
      "weight": 2,
      "ai": "moon_scopecombo",
      "aiOptions": {
        "puPlan": [
          [
            2,
            "scope",
            3
          ],
          [
            4,
            "scope",
            5
          ],
          [
            4,
            "combo",
            3
          ],
          [
            5,
            "combo",
            5
          ]
        ],
        "eff": {
          "joker>combo": 1,
          "adaptive+combo": 0.9,
          "combo+combo": 0.7,
          "moon+moon": 0.6,
          "scope+scope": 0.5,
          "adaptive+moon": 0.35,
          "joker>scope": 0.3,
          "adaptive+scope": 0.25,
          "adaptive+adaptive": 0.15,
          "joker>adaptive": 0.1,
          "joker+joker": 0.1,
          "adaptive+joker": 0.05
        },
        "moonCopy": {
          "splitPips": 4,
          "lo": 0.275,
          "hi": 0.325
        },
        "lowFirst": 0.01,
        "minScoreNotFull": 0,
        "Lref": 30,
        "emptyW": 3,
        "kL": 1,
        "kSeed": 0.8,
        "seedMaxPips": 4,
        "kJoker": 0.3,
        "kW": 0.5,
        "kCrit": 1,
        "critPen": [
          0,
          0,
          0,
          0.05,
          0.1,
          0.2,
          1.5,
          3
        ],
        "kWMag": 4,
        "kTok": 1,
        "tokJoker": 1.5,
        "tokAdaptive": 0.7,
        "critMaxPips": 7,
        "critOpsOffWave": 10,
        "kFire": 4,
        "kShort": 2,
        "marginHi": 2.5,
        "bossWeightMin": 0.3,
        "bossHpMul": 8,
        "bossKillFrac": 0.8,
        "bossNeedMul": {
          "leon": 0.5,
          "magician": 0.5
        },
        "sendFactor": 1,
        "inflowMul": 1.2,
        "eAssume": 6,
        "lookAhead": 20,
        "magLead": 15,
        "magLowPips": 2,
        "magLow": 0.6,
        "magPair": 0.6,
        "zakoOk": 1.5,
        "bossOk": 1.5,
        "leonLead": 15,
        "leonStopFromWave": 5,
        "kLeon1": 1.5,
        "combo1UseAdaptive": true,
        "leonForceToWave": 2,
        "magHoldFirstMeteor": true,
        "kCritOut": 1,
        "knightBossMul": 2,
        "knightActual": 0.1,
        "seed1Mul": 1.5,
        "joker1Pen": 0.4,
        "jokerToAdaptivePen": 5,
        "critComboMinPips": 3,
        "critComboPen": 0.8,
        "critComboScope": 0.25,
        "critRelaxW": 64,
        "magNoEscape": true,
        "moonActiveMul": 1.03,
        "corner1": 3.5,
        "corner2": 8.5,
        "freezeFromWave": 4,
        "freezeMoonPips": 4,
        "moonPuPips": 5,
        "moonPuLv": 5,
        "freezeAllowPu": true,
        "bossFreeze": true,
        "fullOnlyFromWave": 2,
        "notFullKeysEarly": [
          "joker>combo",
          "scope+scope",
          "adaptive+combo"
        ],
        "notFullKeys": [
          "joker>combo"
        ]
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "combo",
        "moon",
        "joker",
        "adaptive",
        "scope"
      ],
      "cls": {
        "combo": 14,
        "moon": 14,
        "joker": 14,
        "adaptive": 15,
        "scope": 14
      },
      "startLv": {
        "combo": 1,
        "moon": 1,
        "joker": 1,
        "adaptive": 1,
        "scope": 1
      },
      "traits": {},
      "cd": 5000,
      "field": "blessing",
      "fieldLv": 20
    },
    {
      "name": "スピガン原子",
      "weight": 0.5,
      "ai": "atomblizzardbasic",
      "aiOptions": {
        "points": {
          "0": 20,
          "1": 15,
          "2": 10,
          "3": 8,
          "4": 8,
          "5": 15,
          "9": 4,
          "10": 10,
          "14": 2
        },
        "pointsLate": {
          "0": 20,
          "1": 15,
          "2": 15,
          "3": 15,
          "4": 20,
          "5": 15,
          "9": 10,
          "10": 10,
          "14": 8
        },
        "lateFrom": 6,
        "pipPow": 1.2,
        "outer7": [
          10,
          5,
          0,
          1,
          2,
          3,
          4
        ],
        "sandMul": 1.5,
        "hpRef": 1500,
        "fireWeight": 0.1,
        "hitsPerPoint": 0.28,
        "borderMin": 20,
        "bossBorder": {
          "slime": 3,
          "basilisk": 2.5,
          "magician": 1.15
        },
        "basiliskLeftBonus": 3,
        "earlyBorder": {
          "1": 0.4,
          "2": 0.4,
          "3": 0.5,
          "4": 0.6
        },
        "kappa": 0.3,
        "wAtom": 100,
        "wBliz": 40,
        "wFire": 15,
        "wGrowth": 15,
        "growthShort": 3,
        "wJoker": 2,
        "wPips": 0.5,
        "blizGoal": 0.5,
        "knightBliz": 2,
        "blizAtomFrom": 5,
        "blizA": 1,
        "blizB": 0.75,
        "blizRef": 0.8,
        "earlyReserveSummons": 3,
        "earlyUntil": 4,
        "fireUnit": 300,
        "firePerLv": 0.9,
        "fireIgnoreFrom": 4,
        "fireIgnorePips": 2,
        "fireOuterMul": 0.5,
        "topFireMul": 1.3,
        "hackPen": 30,
        "pip7Pen": 25,
        "jgMergePen": 30,
        "jgMergeMin": 40,
        "forceGrowthUntil": 4,
        "jokerMergeMin": -2,
        "mergeMin": 0.5,
        "emptyDiscount": 0.8,
        "knightHpRatio": 0.25,
        "knightLook": 6,
        "w2FireLv": 2,
        "stuckPu": [
          [
            "atom",
            5
          ],
          [
            "blizzard",
            3
          ],
          [
            "fire",
            3
          ],
          [
            "fire",
            5
          ],
          [
            "blizzard",
            5
          ]
        ],
        "sinkSummons": 3,
        "sinkMaxPips": 2,
        "sinkTol": 15,
        "debug": 0
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "atom_650",
        "blizzard",
        "speedgun",
        "growth",
        "joker"
      ],
      "cls": {
        "atom_650": 13,
        "blizzard": 11,
        "speedgun": 15,
        "growth": 10,
        "joker": 11
      },
      "startLv": {
        "atom_650": 1,
        "blizzard": 1,
        "speedgun": 1,
        "growth": 1,
        "joker": 1
      },
      "traits": {},
      "cd": 5000,
      "field": "plasma",
      "fieldLv": 20
    },
    {
      "name": "原子コンボ",
      "weight": 0.2,
      "ai": "atomcombo",
      "aiOptions": {
        "points": {
          "0": 20,
          "1": 15,
          "2": 10,
          "3": 8,
          "4": 8,
          "5": 15,
          "9": 4,
          "10": 10,
          "14": 2
        },
        "pointsLate": {
          "0": 20,
          "1": 15,
          "2": 15,
          "3": 15,
          "4": 20,
          "5": 15,
          "9": 10,
          "10": 10,
          "14": 8
        },
        "lateFrom": 6,
        "pipPow": 1.2,
        "outer7": [
          10,
          5,
          0,
          1,
          2,
          3,
          4
        ],
        "sandMul": 1.5,
        "hpRef": 1500,
        "fireWeight": 0.1,
        "hitsPerPoint": 0.28,
        "borderMin": 20,
        "bossBorder": {
          "slime": 3,
          "basilisk": 2.5,
          "magician": 1.15
        },
        "basiliskLeftBonus": 3,
        "earlyBorder": {
          "1": 0.4,
          "2": 0.4,
          "3": 0.5,
          "4": 0.6
        },
        "kappa": 0.3,
        "wAtom": 100,
        "wBliz": 40,
        "wFire": 15,
        "wGrowth": 5,
        "growthShort": 3,
        "wJoker": 2,
        "wPips": 0.5,
        "blizGoal": 0.5,
        "knightBliz": 2,
        "blizAtomFrom": 5,
        "blizA": 1,
        "blizB": 0.75,
        "blizRef": 0.8,
        "earlyReserveSummons": 3,
        "earlyUntil": 4,
        "fireUnit": 300,
        "firePerLv": 0.9,
        "fireIgnoreFrom": 4,
        "fireIgnorePips": 2,
        "fireOuterMul": 0.5,
        "topFireMul": 1.3,
        "hackPen": 30,
        "pip7Pen": 25,
        "jgMergePen": 30,
        "jgMergeMin": 40,
        "forceGrowthUntil": 0,
        "jokerMergeMin": -2,
        "mergeMin": 0.5,
        "emptyDiscount": 0.8,
        "knightHpRatio": 0.25,
        "knightLook": 6,
        "w2FireLv": 2,
        "stuckPu": [
          [
            "atom",
            5
          ],
          [
            "blizzard",
            3
          ],
          [
            "fire",
            3
          ],
          [
            "fire",
            5
          ],
          [
            "blizzard",
            5
          ]
        ],
        "sinkSummons": 3,
        "sinkMaxPips": 2,
        "sinkTol": 15,
        "comboCopyBase": 2,
        "otherCopyBase": 1,
        "critComboMin": 2,
        "critComboPen": 25,
        "critPipFrom": 4,
        "critPipPen": 8,
        "debug": 0
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "atom_650",
        "blizzard",
        "combo",
        "growth",
        "joker"
      ],
      "cls": {
        "atom_650": 15,
        "blizzard": 11,
        "combo": 13,
        "growth": 10,
        "joker": 11
      },
      "startLv": {
        "atom_650": 1,
        "blizzard": 1,
        "combo": 1,
        "growth": 1,
        "joker": 1
      },
      "traits": {},
      "cd": 5000,
      "field": "paradise",
      "fieldLv": 20
    },
    {
      "name": "祝福台風地獄核",
      "weight": 25,
      "ai": "typhoon_hell_nuke_basic",
      "aiOptions": {
        "nukeHold": 2.5,
        "midFromWave": 3,
        "bossNukeFromWave": 3,
        "bossNukeEarly": {
          "2": [
            "leon"
          ]
        },
        "leonStopWave": 1,
        "leonStopTyphoons": 3,
        "skillFirstWave": 20,
        "skillFirstBosses": [
          "leon"
        ],
        "prepStuckBosses": [
          "basilisk",
          "slime"
        ],
        "prepStuckFromWave": 3,
        "prepStuckMaxNukes": 6,
        "slimeIdleMaxSum": 10,
        "slimePrepSum": 10,
        "nukePipCap": 4,
        "pairFreeTH": 9,
        "normalFromWave": 3,
        "jokerTyphoonUntilWave": 2,
        "bossFullRatio": 0.8,
        "extraStuck": true,
        "corner1": 3.5,
        "corner2": 8.5
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "nuke",
        "typhoon",
        "adaptive",
        "joker",
        "hell"
      ],
      "cls": {
        "nuke": 11,
        "typhoon": 14,
        "adaptive": 15,
        "joker": 10,
        "hell": 11
      },
      "startLv": {
        "nuke": 1,
        "typhoon": 1,
        "adaptive": 1,
        "joker": 1,
        "hell": 1
      },
      "traits": {},
      "cd": 4000,
      "field": "blessing",
      "fieldLv": 16
    },
    {
      "name": "祝福月スココン",
      "weight": 2,
      "ai": "moon_scopecombo",
      "aiOptions": {
        "puPlan": [
          [
            2,
            "scope",
            3
          ],
          [
            4,
            "scope",
            5
          ],
          [
            4,
            "combo",
            3
          ],
          [
            5,
            "combo",
            5
          ]
        ],
        "eff": {
          "joker>combo": 1,
          "adaptive+combo": 0.9,
          "combo+combo": 0.7,
          "moon+moon": 0.6,
          "scope+scope": 0.5,
          "adaptive+moon": 0.35,
          "joker>scope": 0.3,
          "adaptive+scope": 0.25,
          "adaptive+adaptive": 0.15,
          "joker>adaptive": 0.1,
          "joker+joker": 0.1,
          "adaptive+joker": 0.05
        },
        "moonCopy": {
          "splitPips": 4,
          "lo": 0.275,
          "hi": 0.325
        },
        "lowFirst": 0.01,
        "minScoreNotFull": 0,
        "Lref": 30,
        "emptyW": 3,
        "kL": 1,
        "kSeed": 0.8,
        "seedMaxPips": 4,
        "kJoker": 0.3,
        "kW": 0.5,
        "kCrit": 1,
        "critPen": [
          0,
          0,
          0,
          0.05,
          0.1,
          0.2,
          1.5,
          3
        ],
        "kWMag": 4,
        "kTok": 1,
        "tokJoker": 1.5,
        "tokAdaptive": 0.7,
        "critMaxPips": 7,
        "critOpsOffWave": 10,
        "kFire": 4,
        "kShort": 2,
        "marginHi": 2.5,
        "bossWeightMin": 0.3,
        "bossHpMul": 8,
        "bossKillFrac": 0.8,
        "bossNeedMul": {
          "leon": 0.5,
          "magician": 0.5
        },
        "sendFactor": 1,
        "inflowMul": 1.2,
        "eAssume": 6,
        "lookAhead": 20,
        "magLead": 15,
        "magLowPips": 2,
        "magLow": 0.6,
        "magPair": 0.6,
        "zakoOk": 1.5,
        "bossOk": 1.5,
        "leonLead": 15,
        "leonStopFromWave": 5,
        "kLeon1": 1.5,
        "combo1UseAdaptive": true,
        "leonForceToWave": 2,
        "magHoldFirstMeteor": true,
        "kCritOut": 1,
        "knightBossMul": 2,
        "knightActual": 0.1,
        "seed1Mul": 1.5,
        "joker1Pen": 0.4,
        "jokerToAdaptivePen": 5,
        "critComboMinPips": 3,
        "critComboPen": 0.8,
        "critComboScope": 0.25,
        "critRelaxW": 64,
        "magNoEscape": true,
        "moonActiveMul": 1.03,
        "corner1": 3.5,
        "corner2": 8.5,
        "freezeFromWave": 4,
        "freezeMoonPips": 4,
        "moonPuPips": 5,
        "moonPuLv": 5,
        "freezeAllowPu": true,
        "bossFreeze": true,
        "fullOnlyFromWave": 2,
        "notFullKeysEarly": [
          "joker>combo",
          "scope+scope",
          "adaptive+combo"
        ],
        "notFullKeys": [
          "joker>combo"
        ]
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "combo",
        "moon",
        "joker",
        "adaptive",
        "scope"
      ],
      "cls": {
        "combo": 14,
        "moon": 14,
        "joker": 14,
        "adaptive": 15,
        "scope": 14
      },
      "startLv": {
        "combo": 1,
        "moon": 1,
        "joker": 1,
        "adaptive": 1,
        "scope": 1
      },
      "traits": {},
      "cd": 5000,
      "field": "blessing",
      "fieldLv": 18
    },
    {
      "name": "楽園スココン",
      "weight": 20,
      "ai": "scopecombo_paradise",
      "aiOptions": {
        "puPlan": [
          [
            2,
            "scope",
            3
          ],
          [
            4,
            "scope",
            5
          ],
          [
            4,
            "combo",
            3
          ],
          [
            5,
            "combo",
            5
          ]
        ],
        "eff": {
          "joker>combo": 1,
          "adaptive+combo": 0.9,
          "combo+combo": 0.7,
          "summon+summon": 0.6,
          "scope+scope": 0.5,
          "joker>summon": 0.4,
          "adaptive+summon": 0.35,
          "joker>scope": 0.3,
          "adaptive+scope": 0.25,
          "adaptive+adaptive": 0.15,
          "joker>adaptive": 0.1,
          "joker+joker": 0.1,
          "adaptive+joker": 0.05
        },
        "lowFirst": 0.01,
        "minScoreNotFull": 0,
        "Lref": 30,
        "emptyW": 3,
        "kL": 1,
        "kSeed": 0.8,
        "seedMaxPips": 4,
        "kJoker": 0.3,
        "kCrit": 0.1,
        "kW": 0.5,
        "kFire": 4,
        "kShort": 2,
        "marginHi": 2.5,
        "bossWeightMin": 0.3,
        "bossHpMul": 8,
        "bossKillFrac": 0.8,
        "bossNeedMul": {
          "leon": 0.5,
          "magician": 0.5
        },
        "sendFactor": 1,
        "inflowMul": 1.2,
        "eAssume": 6,
        "lookAhead": 20,
        "magLead": 60,
        "magLowPips": 2,
        "magLow": 0.6,
        "magPair": 0.6,
        "fullOnlyFromWave": 2,
        "notFullKeysEarly": [
          "joker>combo",
          "summon+summon",
          "scope+scope",
          "adaptive+combo",
          "adaptive+summon"
        ],
        "notFullKeys": [
          "joker>combo",
          "summon+summon"
        ]
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "scope",
        "combo",
        "summon",
        "adaptive",
        "joker"
      ],
      "cls": {
        "scope": 15,
        "combo": 13,
        "summon": 15,
        "adaptive": 15,
        "joker": 15
      },
      "startLv": {
        "scope": 1,
        "combo": 1,
        "summon": 1,
        "adaptive": 1,
        "joker": 1
      },
      "traits": {},
      "cd": 6000,
      "field": "paradise",
      "fieldLv": 20
    },
    {
      "name": "楽園スココン",
      "weight": 8,
      "ai": "scopecombo_paradise",
      "aiOptions": {
        "puPlan": [
          [
            2,
            "scope",
            3
          ],
          [
            4,
            "scope",
            5
          ],
          [
            4,
            "combo",
            3
          ],
          [
            5,
            "combo",
            5
          ]
        ],
        "eff": {
          "joker>combo": 1,
          "adaptive+combo": 0.9,
          "combo+combo": 0.7,
          "summon+summon": 0.6,
          "scope+scope": 0.5,
          "joker>summon": 0.4,
          "adaptive+summon": 0.35,
          "joker>scope": 0.3,
          "adaptive+scope": 0.25,
          "adaptive+adaptive": 0.15,
          "joker>adaptive": 0.1,
          "joker+joker": 0.1,
          "adaptive+joker": 0.05
        },
        "lowFirst": 0.01,
        "minScoreNotFull": 0,
        "Lref": 30,
        "emptyW": 3,
        "kL": 1,
        "kSeed": 0.8,
        "seedMaxPips": 4,
        "kJoker": 0.3,
        "kCrit": 0.1,
        "kW": 0.5,
        "kFire": 4,
        "kShort": 2,
        "marginHi": 2.5,
        "bossWeightMin": 0.3,
        "bossHpMul": 8,
        "bossKillFrac": 0.8,
        "bossNeedMul": {
          "leon": 0.5,
          "magician": 0.5
        },
        "sendFactor": 1,
        "inflowMul": 1.2,
        "eAssume": 6,
        "lookAhead": 20,
        "magLead": 60,
        "magLowPips": 2,
        "magLow": 0.6,
        "magPair": 0.6,
        "fullOnlyFromWave": 2,
        "notFullKeysEarly": [
          "joker>combo",
          "summon+summon",
          "scope+scope",
          "adaptive+combo",
          "adaptive+summon"
        ],
        "notFullKeys": [
          "joker>combo",
          "summon+summon"
        ]
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "combo",
        "joker",
        "summon",
        "adaptive",
        "scope"
      ],
      "cls": {
        "combo": 13,
        "joker": 10,
        "summon": 15,
        "adaptive": 15,
        "scope": 15
      },
      "startLv": {
        "combo": 1,
        "joker": 5,
        "summon": 1,
        "adaptive": 1,
        "scope": 1
      },
      "traits": {},
      "cd": 5500,
      "field": "blessing",
      "fieldLv": 17
    },
    {
      "name": "月太陽ハッキング(妨害AI)",
      "weight": 0.3,
      "ai": "moonsun_disrupt_royal",
      "aiOptions": {
        "freeType": null,
        "aiSpeed": 0.3,
        "royalAttack": true,
        "royalFromWave": 5,
        "royalStartMax": 45,
        "royalStartMin": 15,
        "royalStartSummons": 10,
        "royalStopSummons": 5,
        "oppFrontLine": 3.5,
        "royalSummon": true,
        "dSkip": 5,
        "dWindow": 5,
        "stopPastPos": 8.5,
        "reachCheck": true,
        "normalSpeed": 0.6,
        "knightRoyal": true,
        "knightRoyalLeft": 5,
        "knightRoyalMaxFront": 8.5,
        "repairJokerFallback": true,
        "starIdleUntil": {
          "6.0.5": 10,
          "6.5.0": 8
        },
        "growthPairLine": 8.5,
        "oppMoonsunBoth": true,
        "oppMoonPipsMin": 5,
        "oppMoonPipsUntil": 19,
        "oppMoonSpdMin": 0.9,
        "starGuardOnly": true,
        "starStopsBuild": true,
        "moonAdjMin": 3,
        "sun7MergeWave": 6,
        "sun7Summons": 5,
        "sunIdleFromWave": 3,
        "w12GrowthAlways": true,
        "w12SpFix": true,
        "sunIdleFix": true,
        "prepLine": 6,
        "earlyLine": 8.5,
        "corner1": 3.5,
        "w1GoLeft": 55,
        "w2Spare": 3,
        "tsumiLimit": 5,
        "horizon": 10,
        "leonIdleKill": 2,
        "knightEatKill": 3,
        "puReserve": 0,
        "freePuGoal": {
          "shield": 5,
          "blizzard": 3
        },
        "growthW": 2.5,
        "keepJokers": 2,
        "growthFirst": true,
        "resumeGap": 0,
        "weakWave": 5,
        "resumeLine": 3.5,
        "weakMargin": 1,
        "capMinTime": 3,
        "startSummons": 10,
        "startWave": 3,
        "keepSummons": 5,
        "pairFallback": "copy",
        "pairUseReserved": false,
        "pairOnlyFull": true,
        "w12GrowthCopy": true,
        "dangerRelax": true,
        "idleRepair": false,
        "starSunMin": 3,
        "topSunMode": "potential",
        "fpMoonGuard": false,
        "growthMergeLine": 8.5,
        "noBuildLeft": 15,
        "activateLeft": 10,
        "jokerLast": true,
        "repairMode": "simple",
        "lowSummons": 5,
        "sevenTarget": false,
        "moonNeedsUse": false,
        "simpleDangerOld": true,
        "startOnce": false,
        "summonHyst": true,
        "over7": false,
        "highJokerGrowth": 4,
        "sunWaitFix": true,
        "knightRules": true,
        "pairMaxUrg": 1
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "moon",
        "sun",
        "ix10",
        "growth",
        "joker"
      ],
      "cls": {
        "moon": 13,
        "sun": 12,
        "ix10": 10,
        "growth": 12,
        "joker": 12
      },
      "startLv": {
        "moon": 1,
        "sun": 1,
        "ix10": 1,
        "growth": 1,
        "joker": 1
      },
      "traits": {},
      "cd": 3000,
      "field": "prism",
      "fieldLv": 20
    },
    {
      "name": "台風テレポフロー",
      "weight": 2,
      "ai": "typhoon_teleport_flow",
      "aiOptions": {
        "speed": 0.3,
        "assassinSpeed": 0.1,
        "sendLeft": 3,
        "knightTyphoon": 5,
        "w3Typhoon": 8,
        "w3FlowMaxPips": 2,
        "otherMaxPips": 2,
        "typhoonMerge": "excess",
        "asnLeft": 45,
        "asnPips": 6,
        "asnTyphoons": 2,
        "fullFallback": true,
        "finalSummon": true,
        "puWait": false
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "typhoon",
        "teleport",
        "flow",
        "growth",
        "joker"
      ],
      "cls": {
        "typhoon": 14,
        "teleport": 15,
        "flow": 13,
        "growth": 13,
        "joker": 13
      },
      "startLv": {
        "typhoon": 1,
        "teleport": 1,
        "flow": 1,
        "growth": 1,
        "joker": 1
      },
      "traits": {},
      "cd": 3000,
      "field": "journal",
      "fieldLv": 20
    },
    {
      "name": "赤ロイ",
      "weight": 1,
      "ai": "bloodsirius_royal",
      "aiOptions": {
        "aiSpeed": 0.3,
        "siriusTargets": [
          3,
          5
        ],
        "w12SiriusOne": false,
        "bmPuAfter": 5,
        "bmPuGoal": 5,
        "royalAttack": true,
        "royalFromWave": 5,
        "royalStartMax": 45,
        "royalStartMin": 15,
        "royalStartSummons": 10,
        "royalStopSummons": 5,
        "oppFrontLine": 3.5,
        "royalSummon": true,
        "dSkip": 5,
        "dWindow": 5,
        "stopPastPos": 8.5,
        "reachCheck": true,
        "normalSpeed": 0.6,
        "knightRoyal": true,
        "knightRoyalLeft": 5,
        "knightRoyalMaxFront": 8.5,
        "repairLastResort": true,
        "repairJokerFallback": true,
        "starIdleUntil": {
          "6.0.5": 10,
          "6.5.0": 8
        },
        "growthPairLine": 8.5,
        "oppMoonsunBoth": true,
        "oppMoonPipsMin": 5,
        "oppMoonPipsUntil": 19,
        "oppMoonSpdMin": 0.9,
        "starGuardOnly": true,
        "starStopsBuild": true,
        "moonAdjMin": 0,
        "needMoonFrom": 2,
        "overMoonPenalty": false,
        "evalMoonMin": 1,
        "sun7MergeWave": 0,
        "sun7Summons": 5,
        "sunIdleFromWave": 3,
        "w12GrowthAlways": true,
        "w12SpFix": true,
        "sunIdleFix": true,
        "prepLine": 6,
        "earlyLine": 8.5,
        "corner1": 3.5,
        "w1GoLeft": 55,
        "w2Spare": 3,
        "tsumiLimit": 5,
        "horizon": 10,
        "leonIdleKill": 2,
        "knightEatKill": 3,
        "puReserve": 0,
        "growthW": 2.5,
        "keepJokers": 2,
        "growthFirst": true,
        "resumeGap": 0,
        "weakWave": 5,
        "resumeLine": 3.5,
        "weakMargin": 1,
        "capMinTime": 3,
        "startSummons": 10,
        "startWave": 3,
        "keepSummons": 5,
        "pairFallback": "copy",
        "pairUseReserved": false,
        "pairOnlyFull": true,
        "w12GrowthCopy": true,
        "dangerRelax": true,
        "idleRepair": false,
        "starSunMin": 3,
        "topSunMode": "potential",
        "fpMoonGuard": false,
        "growthMergeLine": 8.5,
        "noBuildLeft": 15,
        "activateLeft": 10,
        "jokerLast": true,
        "repairMode": "simple",
        "lowSummons": 5,
        "sevenTarget": false,
        "moonNeedsUse": false,
        "simpleDangerOld": true,
        "startOnce": false,
        "summonHyst": true,
        "over7": false,
        "highJokerGrowth": 4,
        "sunWaitFix": true,
        "knightRules": true,
        "pairMaxUrg": 1
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "bloodmoon",
        "sirius",
        "growth",
        "joker",
        "royal"
      ],
      "cls": {
        "bloodmoon": 12,
        "sirius": 10,
        "growth": 10,
        "joker": 10,
        "royal": 10
      },
      "startLv": {
        "bloodmoon": 1,
        "sirius": 1,
        "growth": 1,
        "joker": 1,
        "royal": 1
      },
      "traits": {},
      "cd": 3000,
      "field": "plasma",
      "fieldLv": 20
    },
    {
      "name": "陰ロイ",
      "weight": 5,
      "ai": "yinyang_royal_ranker",
      "aiOptions": {
        "jokerAll": true,
        "jokerAfterFill": true,
        "y2plan": true,
        "raiseSwitch": true,
        "leonW2": true,
        "assassinDodge": true,
        "harmonyBoard": true,
        "pierce": true,
        "pierceMult": 1.5,
        "jamFromWave": 6,
        "puLv": 5,
        "fireFromWave": 7,
        "fireSkipSec": 12,
        "dWindow": 5,
        "stopPastPos": 8.5,
        "normalSpeed": 0.6,
        "thrFromWave": 2,
        "thrCritUntil": 3,
        "thrLastSec": 15,
        "thrMult": 3,
        "thrBuf": 5,
        "thrHyst": 1.5,
        "thrMoveSec": 0.6,
        "nukeFire": 8,
        "nukeFireBless": 10,
        "nukeHellPips": 2,
        "nukeThrUntil": 7,
        "nukeKnightFrom": 5,
        "nukeKeepFrom": 4,
        "nukePuFrom": 4,
        "nukeKnightKeep": 6,
        "comboFire": 8,
        "comboParadiseWave": 8,
        "comboParadisePips": 5,
        "comboFireBless": 13,
        "comboBlessScopeWave": 6,
        "comboThrUntil": 8,
        "msCorner": 8.5,
        "msCenter": 6,
        "msCenterLeft": 30,
        "msEarlyFrom": 4,
        "msLateFrom": 6,
        "msRefMoon": 6,
        "msRefSun": 6,
        "rmsSkipSec": 10,
        "rmsLimitPos": 9.5,
        "msT": null,
        "paraSwitch": true,
        "paraSwitchOff": [
          "paradiseScopeCombo"
        ],
        "paraSwitchYY": false,
        "raise5From": 7,
        "raise5To": 5,
        "raise4From": 4,
        "deficitArrange": true,
        "critMax": 6,
        "msRaise6": true,
        "stuckJoker": true,
        "normalLimit": {
          "interval": 0.5,
          "actInterval": 0.3,
          "summonInterval": 0.3,
          "dragTime": 0.3
        },
        "critNearGoal": [
          "nuke",
          "blessScopeCombo",
          "paradiseScopeCombo"
        ],
        "thrPU": true,
        "thrFire": true,
        "knightOtherCrit": true,
        "matchup": null,
        "matchupModules": null,
        "sw2Crit": false,
        "dodgeOther": true,
        "dodgeMinIn": null,
        "assassinLimit": 0.1
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "yinyang_650",
        "royal",
        "switch",
        "nutrient",
        "joker"
      ],
      "cls": {
        "yinyang_650": 10,
        "royal": 11,
        "switch": 15,
        "nutrient": 11,
        "joker": 11
      },
      "startLv": {
        "yinyang_650": 1,
        "royal": 1,
        "switch": 1,
        "nutrient": 1,
        "joker": 1
      },
      "traits": {},
      "cd": 4000,
      "field": "paradise",
      "fieldLv": 20
    },
    {
      "name": "陰転",
      "weight": 5,
      "ai": "yinyang_metastasis",
      "aiOptions": {
        "trGap": 7,
        "trMidGap": 7,
        "trFromWave": 3,
        "trSlimePos": 6,
        "midTable": {
          "3": [
            53,
            37,
            21,
            5
          ],
          "4": [
            45,
            31,
            17,
            2
          ],
          "5": [
            47,
            35,
            23,
            11
          ]
        },
        "jokerAll": true,
        "jokerAfterFill": true,
        "y2plan": true,
        "raiseSwitch": true,
        "leonW2": true,
        "assassinDodge": true,
        "harmonyBoard": true,
        "pierce": true,
        "pierceMult": 1.5,
        "jamFromWave": 6,
        "puLv": 5,
        "fireFromWave": 7,
        "fireSkipSec": 12,
        "dWindow": 5,
        "stopPastPos": 8.5,
        "normalSpeed": 0.6,
        "thrFromWave": 2,
        "thrCritUntil": 3,
        "thrLastSec": 15,
        "thrMult": 3,
        "thrBuf": 5,
        "thrHyst": 1.5,
        "thrMoveSec": 0.6,
        "nukeThrUntil": 7,
        "nukeKnightFrom": 5,
        "nukeKeepFrom": 4,
        "nukePuFrom": 4,
        "nukeKnightKeep": 6,
        "comboFire": 8,
        "comboParadiseWave": 8,
        "comboParadisePips": 5,
        "comboFireBless": 13,
        "comboBlessScopeWave": 6,
        "comboThrUntil": 8,
        "msCorner": 8.5,
        "msCenter": 6,
        "msCenterLeft": 30,
        "msEarlyFrom": 4,
        "msLateFrom": 6,
        "msRefMoon": 6,
        "msRefSun": 6,
        "rmsSkipSec": 10,
        "rmsLimitPos": 9.5,
        "msT": null,
        "paraSwitch": true,
        "paraSwitchOff": [
          "paradiseScopeCombo"
        ],
        "paraSwitchYY": false,
        "raise5From": 7,
        "raise5To": 5,
        "raise4From": 4,
        "deficitArrange": true,
        "critMax": 6,
        "msRaise6": true,
        "stuckJoker": true,
        "normalLimit": {
          "interval": 0.5,
          "actInterval": 0.3,
          "summonInterval": 0.3,
          "dragTime": 0.3
        },
        "critNearGoal": [
          "nuke",
          "blessScopeCombo",
          "paradiseScopeCombo"
        ],
        "thrPU": true,
        "thrFire": true,
        "knightOtherCrit": true,
        "matchup": null,
        "matchupModules": null,
        "sw2Crit": false,
        "dodgeOther": true,
        "dodgeMinIn": null,
        "assassinLimit": 0.1
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "yinyang_650",
        "transfer_650",
        "switch",
        "nutrient",
        "joker"
      ],
      "cls": {
        "yinyang_650": 11,
        "transfer_650": 10,
        "switch": 15,
        "nutrient": 11,
        "joker": 11
      },
      "startLv": {
        "yinyang_650": 1,
        "transfer_650": 1,
        "switch": 1,
        "nutrient": 1,
        "joker": 1
      },
      "traits": {},
      "cd": 4000,
      "field": "paradise",
      "fieldLv": 20
    },
    {
      "name": "月スイ",
      "weight": 4,
      "ai": "moonsun_switch_ranker",
      "aiOptions": {
        "prepLine": 6,
        "earlyLine": 8.5,
        "corner1": 3.5,
        "w1GoLeft": 55,
        "w2Spare": 3,
        "tsumiLimit": 4,
        "horizon": 10,
        "leonIdleKill": 2,
        "knightEatKill": 3,
        "puReserve": 0,
        "freePuGoal": {
          "shield": 5,
          "blizzard": 3
        },
        "growthW": 2.5,
        "keepJokers": 2,
        "growthFirst": true,
        "resumeGap": 0,
        "weakWave": 5,
        "resumeLine": 3.5,
        "weakMargin": 1,
        "capMinTime": 3,
        "startSummons": 10,
        "startWave": 3,
        "keepSummons": 5,
        "pairFallback": "copy",
        "pairUseReserved": false,
        "pairOnlyFull": true,
        "w12GrowthCopy": true,
        "dangerRelax": true,
        "idleRepair": false,
        "starSunMin": 3,
        "topSunMode": "potential",
        "fpMoonGuard": false,
        "growthMergeLine": 8.5,
        "noBuildLeft": 15,
        "activateLeft": 10,
        "jokerLast": true,
        "repairMode": "simple",
        "lowSummons": 5,
        "sevenTarget": false,
        "moonNeedsUse": false,
        "simpleDangerOld": true,
        "startOnce": false,
        "summonHyst": true,
        "over7": false,
        "highJokerGrowth": 3,
        "sunWaitFix": true,
        "knightRules": true,
        "pairMaxUrg": 1,
        "repairJokerFallback": true,
        "sunIdleFix": true,
        "sunIdleFromWave": 3,
        "sun7MergeWave": 6,
        "sun7Summons": 5,
        "w12GrowthAlways": true,
        "w12SpFix": true,
        "moonAdjMin": 3,
        "sunOneActive": false,
        "reservedGrowth": 3,
        "alwaysBuildWave": 5,
        "freeMerge": true,
        "pairPreferMoon": true,
        "puAdjSun": 2,
        "w1MoonMerge": true,
        "mergeDir": true,
        "asnMode": true,
        "asnSpeed": 0.1,
        "asnCorner": 8.5,
        "asnSunOneEarly": false,
        "asnPu": false,
        "asnSwap": true,
        "asnSwitchKeep": 2,
        "aiSpeed": 0.4,
        "switchAdjust": true,
        "adjustGain": 0.02,
        "adjustDepth": 2,
        "knightIntroLower": true,
        "lowerMoves": 3,
        "sqDice": [
          "combo",
          "nuke"
        ],
        "sqMoon": 6,
        "sqSun": 3,
        "sqRestoreLine": 8.5,
        "sqCenter": 6,
        "sqOnLeft": 15,
        "sqOnLeftStar": 20,
        "sqStepSec": 5,
        "sqStepLine": 1
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "moon",
        "sun",
        "switch",
        "growth",
        "joker"
      ],
      "cls": {
        "moon": 13,
        "sun": 12,
        "switch": 15,
        "growth": 12,
        "joker": 12
      },
      "startLv": {
        "moon": 1,
        "sun": 1,
        "switch": 1,
        "growth": 1,
        "joker": 1
      },
      "traits": {},
      "cd": 3000,
      "field": "crystal_665",
      "fieldLv": 20
    },
    {
      "name": "月コンロイヤル",
      "weight": 1,
      "ai": "moon_combo_royal",
      "aiOptions": {
        "limitsNormal": {
          "interval": 0.1,
          "summonInterval": 0.3,
          "actInterval": 0.5,
          "dragTime": 0.2
        },
        "limitsFast": {
          "interval": 0.1,
          "summonInterval": 0.2,
          "actInterval": 0.2,
          "dragTime": 0.2
        },
        "strongFromWave": 3,
        "holdMoonPips": 4,
        "holdFrac": 0.5,
        "pushProg": 0.45,
        "pushBackTo": 0.25,
        "pressedRatio": 1,
        "idleMinSp": null,
        "idleAhead": 3,
        "idleZ": 1.5,
        "idleB": 1.5,
        "earnFree": false,
        "earnMaxLoss": 2,
        "acceptMaxLoss": 6,
        "midLo": 3,
        "midHi": 5,
        "midHoldPen": 0.6,
        "zonePen": 1,
        "sixRule": true,
        "kGrowHaz": 0.6,
        "growHazPips": 2,
        "moonCopyFreeToWave": 0,
        "careMoonPips": 3,
        "careComboPips": 2,
        "w1JokerCombo": true,
        "jokerGrowthMinPips": 2,
        "noGrowthPairUntilStrong": true,
        "maxInflowPerDt": 5.6,
        "zakoSpeed": 0.6,
        "rotGrowPips": 4,
        "rotMaxLoss": 2,
        "rotMatchBonus": 1,
        "magJoker": true,
        "mjMoonMin": 6,
        "mjJokerMin": 4,
        "mjKillT": 1.5,
        "w1MoonPairMax": 2,
        "w1PairActGuard": true,
        "kExtraMoon": 0,
        "reserveSummons": 8,
        "reserveFromWave": 5,
        "puMode": "toa",
        "moonPuPips": 4,
        "moonPuLv": 5,
        "comboPuLv": 3,
        "comboPuFromWave": 3,
        "corner1": 3.5,
        "puSpareSummons": 3,
        "moonMergeLock": true,
        "moonLockPips": 4,
        "moonLockAll": false,
        "moonLockTies": false,
        "knightEarnLeft": 25,
        "knightMixLeft": 10,
        "knightStar": true,
        "leonAccept": true,
        "leonStarMoons": 3,
        "leonOtherStars": 3,
        "leonTau": 0.5,
        "magTake": true,
        "magSync": true,
        "magSyncComboMax": 8,
        "magLead": 15,
        "magLowPips": 2,
        "magLowBonus": 0.6,
        "kZoneOut": 1,
        "kWMag": 4,
        "deactLead": 8,
        "flowProg": 0.5,
        "magKillProg": 0.62,
        "deactMinRecover": 0.6,
        "dirEps": 0.03,
        "notFullKeysToa": [
          "joker>combo",
          "adaptive+combo",
          "adaptive+growth",
          "growth+growth",
          "joker>growth"
        ],
        "eff": {
          "joker>combo": 1,
          "adaptive+combo": 0.9,
          "combo+combo": 0.7,
          "moon+moon": 0.45,
          "joker>growth": 0.4,
          "growth+growth": 0.3,
          "adaptive+growth": 0.3,
          "adaptive+moon": 0.3,
          "adaptive+adaptive": 0.15,
          "joker>adaptive": 0.1,
          "joker+joker": 0.1,
          "adaptive+joker": 0.05
        },
        "moonCopy": {
          "splitPips": 4,
          "lo": 0.275,
          "hi": 0.325
        },
        "lowFirst": 0.01,
        "minScoreNotFull": 0,
        "Lref": 30,
        "emptyW": 3,
        "kL": 1,
        "kSeed": 0.8,
        "seedMaxPips": 4,
        "kJoker": 0.3,
        "kW": 0.5,
        "kCrit": 1,
        "critPen": [
          0,
          0,
          0,
          0.05,
          0.1,
          0.2,
          1.5,
          3
        ],
        "critRelaxW": 64,
        "critOpsOffWave": 10,
        "critMaxPips": 7,
        "kTok": 1,
        "tokJoker": 1.5,
        "tokAdaptive": 0.7,
        "kFire": 4,
        "kShort": 2,
        "marginHi": 2.5,
        "bossWeightMin": 0.3,
        "bossHpMul": 8,
        "bossKillFrac": 0.8,
        "bossFirst": 2,
        "sendFactor": 1,
        "inflowMul": 1.2,
        "lookAhead": 20,
        "leonLead": 15,
        "leonStopFromWave": 5,
        "kLeon1": 1.5,
        "combo1UseAdaptive": true,
        "leonForceToWave": 2,
        "seed1Mul": 1.5,
        "knightBossMul": 2,
        "knightActual": 0.1,
        "knightPierce": 1,
        "joker1Pen": 0.4,
        "jokerToAdaptivePen": 5,
        "critComboMinPips": 3,
        "critComboPen": 0.8,
        "repairCopy": 0.95,
        "repairMerge": 0.9,
        "growH": 2,
        "kGrow": 0.15,
        "kStar": 1.5,
        "b2Cell": 6,
        "b2Mul": 1.3,
        "summonTol": 0.3,
        "dangerProg": 0.75,
        "bossDangerProg": 0.5,
        "stuckS": 0,
        "notFullShort": 1,
        "notFullKeysEarly": [
          "joker>combo",
          "adaptive+combo"
        ],
        "fullOnlyFromWave": 2,
        "royalFromWave": 4,
        "royalKeep": 1,
        "seedNeedsJoker": true,
        "starClear": true,
        "holdPreStar": true,
        "starRoyal": true,
        "dAggressive": 6,
        "dSkip": 5,
        "dWindow": 5,
        "stopPastPos": 8.5,
        "reachCheck": true,
        "normalSpeed": 0.6,
        "lowRoyalRatio": 0.6,
        "starPuTypes": [
          "moon",
          "combo"
        ],
        "starSummonKeep": 3
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "combo",
        "moon",
        "joker",
        "growth",
        "royal"
      ],
      "cls": {
        "combo": 13,
        "moon": 13,
        "joker": 14,
        "growth": 10,
        "royal": 10
      },
      "startLv": {
        "combo": 1,
        "moon": 1,
        "joker": 1,
        "growth": 1,
        "royal": 1
      },
      "traits": {},
      "cd": 3000,
      "field": "blessing",
      "fieldLv": 19
    },
    {
      "name": "インコマン式月太陽テレポ",
      "weight": 4,
      "ai": "moonsun_tele_incoman",
      "aiOptions": {
        "matchup": "auto",
        "normalFromWave": 6,
        "normalSendBosses": [
          "knight",
          "leon"
        ],
        "yyPips": 3,
        "yyIntroLead": 0.4,
        "slimeCorner": 3.5,
        "slimeGap": 2,
        "aiSpeed": 0.3,
        "dangerLine": 8.5,
        "selfBosses": [
          "knight",
          "magician"
        ],
        "sendBosses": [
          "leon"
        ],
        "fullFree": 2,
        "sendMargin": 1.5,
        "sendOpTime": 0.7,
        "selfMin": 5,
        "selfMax": 25,
        "nearFull": 3,
        "pairFull": 5,
        "fullFromWave": 2,
        "teleCopy": true,
        "chainWaves": 1,
        "chainLeft": 3,
        "chainCopyAt": 0.8,
        "cutSunUntil": 5,
        "cutAct": true,
        "telePuPips": 3,
        "telePuPips3": 6,
        "teleMin": 3,
        "telePuMax": 3,
        "telePuLeon": 2,
        "telePuKeep": 5,
        "prepLine": 6,
        "earlyLine": 8.5,
        "corner1": 3.5,
        "w1GoLeft": 35,
        "w1GoLine": 8.5,
        "w2Spare": 0,
        "tsumiLimit": 4,
        "horizon": 10,
        "leonIdleKill": 2,
        "knightEatKill": 3,
        "puReserve": 0,
        "freePuGoal": {
          "shield": 5,
          "blizzard": 3
        },
        "growthW": 2.5,
        "keepJokers": 2,
        "growthFirst": true,
        "resumeGap": 0,
        "weakWave": 5,
        "resumeLine": 3.5,
        "weakMargin": 1,
        "capMinTime": 3,
        "startSummons": 10,
        "startWave": 4,
        "keepSummons": 5,
        "pairFallback": "copy",
        "pairUseReserved": false,
        "pairOnlyFull": true,
        "w12GrowthCopy": true,
        "dangerRelax": true,
        "idleRepair": false,
        "starSunMin": 3,
        "topSunMode": "potential",
        "fpMoonGuard": false,
        "growthMergeLine": 8.5,
        "noBuildLeft": 15,
        "activateLeft": 10,
        "jokerLast": true,
        "repairMode": "simple",
        "lowSummons": 5,
        "sevenTarget": false,
        "moonNeedsUse": false,
        "simpleDangerOld": true,
        "startOnce": false,
        "summonHyst": true,
        "over7": false,
        "highJokerGrowth": 3,
        "sunWaitFix": false,
        "knightRules": true,
        "pairMaxUrg": 1,
        "repairJokerFallback": true,
        "sunIdleFix": false,
        "sunIdleFromWave": 3,
        "sun7MergeWave": 6,
        "sun7Summons": 5,
        "w12GrowthAlways": true,
        "w12SpFix": true,
        "moonAdjMin": 3,
        "sunOneActive": true,
        "reservedGrowth": 3,
        "alwaysBuildWave": 5,
        "freeMerge": true,
        "pairPreferMoon": true,
        "puAdjSun": 2,
        "w1MoonMerge": true,
        "mergeDir": true,
        "asnMode": false,
        "asnSpeed": 0.1,
        "asnCorner": 8.5,
        "asnSunOneEarly": false,
        "asnPu": false
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "moon",
        "sun",
        "teleport",
        "growth",
        "joker"
      ],
      "cls": {
        "moon": 12,
        "sun": 12,
        "teleport": 15,
        "growth": 12,
        "joker": 12
      },
      "startLv": {
        "moon": 1,
        "sun": 1,
        "teleport": 1,
        "growth": 1,
        "joker": 1
      },
      "traits": {},
      "cd": 3000,
      "field": "plasma",
      "fieldLv": 20
    },
    {
      "name": "月ロイ",
      "weight": 10,
      "ai": "moonsun_royal_ranker",
      "aiOptions": {
        "thinkTime": 0.5,
        "opTime": 0.3,
        "corner1": 3.5,
        "center": 6,
        "corner2": 8.5,
        "laneMid": 10.25,
        "lowMoonMerge": 2,
        "makeRoom": [
          [
            "royal",
            3
          ],
          [
            "moon",
            2
          ],
          [
            "royal",
            2
          ],
          [
            "moon",
            1
          ],
          [
            "royal",
            1
          ],
          [
            "sun",
            1
          ]
        ],
        "firstSummons": 4,
        "saveSummons": 7,
        "growWatch": 3,
        "growLast": 1,
        "growMaxPips": 3,
        "last10": 10,
        "last10Late": 15,
        "last10LateFrom": 7,
        "royalFlag": "auto",
        "asnMode": true,
        "asnSpeed": 0.1,
        "asnCorner": 8.5,
        "royalCopySummons": 7,
        "starAwayPips": 5,
        "knightCut": 1,
        "keepJokerFrom": 6,
        "oppWeakFrom": 6,
        "oppWeakAhead": 2,
        "sunLostLongFrom": 8,
        "knightMoonOff": 6,
        "growStop": 3,
        "tripleCopy": 3,
        "halfLimit": 0.5,
        "laneEndLimit": 0.2,
        "aheadWaves": 3,
        "holdBelow": 4,
        "holdUntil": 7,
        "puMargin": 4
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "moon",
        "sun",
        "royal",
        "growth",
        "joker"
      ],
      "cls": {
        "moon": 14,
        "sun": 12,
        "royal": 12,
        "growth": 12,
        "joker": 12
      },
      "startLv": {
        "moon": 1,
        "sun": 1,
        "royal": 1,
        "growth": 1,
        "joker": 1
      },
      "traits": {},
      "cd": 4000,
      "field": "plasma",
      "fieldLv": 20
    },
    {
      "name": "コロシアム月ロイ",
      "weight": 6,
      "ai": "moonsun_royal_ranker",
      "aiOptions": {
        "thinkTime": 0.5,
        "opTime": 0.3,
        "corner1": 3.5,
        "center": 6,
        "corner2": 8.5,
        "laneMid": 10.25,
        "lowMoonMerge": 2,
        "makeRoom": [
          [
            "royal",
            3
          ],
          [
            "moon",
            2
          ],
          [
            "royal",
            2
          ],
          [
            "moon",
            1
          ],
          [
            "royal",
            1
          ],
          [
            "sun",
            1
          ]
        ],
        "firstSummons": 4,
        "saveSummons": 7,
        "growWatch": 3,
        "growLast": 1,
        "growMaxPips": 3,
        "last10": 10,
        "last10Late": 15,
        "last10LateFrom": 7,
        "royalFlag": "auto",
        "asnMode": true,
        "asnSpeed": 0.1,
        "asnCorner": 8.5,
        "royalCopySummons": 7,
        "starAwayPips": 5,
        "knightCut": 1,
        "keepJokerFrom": 6,
        "oppWeakFrom": 6,
        "oppWeakAhead": 2,
        "sunLostLongFrom": 8,
        "knightMoonOff": 6,
        "growStop": 3,
        "tripleCopy": 3,
        "halfLimit": 0.5,
        "laneEndLimit": 0.2,
        "aheadWaves": 3,
        "holdBelow": 4,
        "holdUntil": 7,
        "puMargin": 4
      },
      "control": {
        "interval": 1,
        "maxOps": 1,
        "summonInterval": 1,
        "actInterval": 1,
        "dragTime": 1
      },
      "deck": [
        "moon",
        "sun",
        "royal",
        "growth",
        "joker"
      ],
      "cls": {
        "moon": 14,
        "sun": 12,
        "royal": 12,
        "growth": 12,
        "joker": 12
      },
      "startLv": {
        "moon": 1,
        "sun": 1,
        "royal": 1,
        "growth": 1,
        "joker": 1
      },
      "traits": {},
      "cd": 4000,
      "field": "colosseum_710",
      "fieldLv": 20
    }
  ]
});
