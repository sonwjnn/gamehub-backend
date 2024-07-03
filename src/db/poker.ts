import { Card } from '@prisma/client'
import { getMatchById } from './matches'
import {
  HighlightCard,
  ParticipantWithCards,
  ParticipantWithPlayerAndCards,
} from '../types'
import { formatCardForSolver } from '../utils/formatting'
import { rankHands } from '@xpressit/winning-poker-hand-rank'
import { PlayingCard } from '@xpressit/winning-poker-hand-rank/dist/types'

interface Hand {
  name: string
  cards: CustomCard[]
}

export interface CustomCard {
  id: string
  rank: string
  suit: string
}

export const formattedCards = (card: CustomCard) => {
  const rankMap: { [key: string]: string } = {
    TWO: '2',
    THREE: '3',
    FOUR: '4',
    FIVE: '5',
    SIX: '6',
    SEVEN: '7',
    EIGHT: '8',
    NINE: '9',
    TEN: '10',
    J: '11',
    Q: '12',
    K: '13',
    A: '1',
  }

  const suitMap: { [key: string]: string } = {
    HEARTS: 'H',
    CLUBS: 'C',
    SPADES: 'S',
    DIAMONDS: 'D',
  }

  return { ...card, rank: rankMap[card.rank], suit: suitMap[card.suit] }
}

export const unformatCards = (card: CustomCard) => {
  const rankMap: { [key: string]: string } = {
    '2': 'TWO',
    '3': 'THREE',
    '4': 'FOUR',
    '5': 'FIVE',
    '6': 'SIX',
    '7': 'SEVEN',
    '8': 'EIGHT',
    '9': 'NINE',
    '10': 'TEN',
    '11': 'J',
    '12': 'Q',
    '13': 'K',
    '1': 'A',
  }

  const suitMap: { [key: string]: string } = {
    H: 'HEARTS',
    C: 'CLUBS',
    S: 'SPADES',
    D: 'DIAMONDS',
  }

  return { ...card, rank: rankMap[card.rank], suit: suitMap[card.suit] }
}

export const formatRankToGetHighlightName = (rank: string) => {
  const rankMap: { [key: string]: string } = {
    '2': '2',
    '3': '3',
    '4': '4',
    '5': '5',
    '6': '6',
    '7': '7',
    '8': '8',
    '9': '9',
    '10': '10',
    '11': 'J',
    '12': 'Q',
    '13': 'K',
    '1': 'A',
  }

  return rankMap[rank]
}

interface getWinnerResponse {
  id: string
  handName: string
  bestHand: CustomCard[]
  winnerHand: CustomCard[]
}

export const getWinner = async (
  participants: ParticipantWithPlayerAndCards[]
) => {
  // determine winner given users and community cards
  // assume the hand has went to showdown (multiple players, 5 community cards, bets in)
  const formattedPaticipants = participants.map(participant => ({
    ...participant,
    cardOne: formattedCards(participant.cardOne),
    cardTwo: formattedCards(participant.cardTwo),
  }))

  const currentMatch = await getMatchById(formattedPaticipants[0].matchId)

  if (!currentMatch) {
    return null
  }

  const board = currentMatch.board.map(item => formattedCards(item))

  let winner = formattedPaticipants[0]

  const winnerCardsWithBoard = [...board, winner.cardOne, winner.cardTwo]

  let winnerHand = getBestHand(winnerCardsWithBoard)

  // console.log('best hand 1: ', winnerHand)
  let ties = [] as getWinnerResponse[]
  for (let i = 1; i < formattedPaticipants.length; i++) {
    let participant = formattedPaticipants[i]
    let participantHand = getBestHand([
      ...board,
      participant.cardOne,
      participant.cardTwo,
    ])

    // console.log('best hand 2: ', participantHand)

    let comparison = compareHands(winnerHand, participantHand)
    if (comparison == 1) {
      winner = participant
      winnerHand = participantHand
    } else if (comparison == -1) {
      if (!ties.some(tie => tie.id === winner.id)) {
        ties.push({
          id: winner.id,
          handName: winnerHand.name,
          bestHand: winnerHand.cards,
          winnerHand: [winner.cardOne, winner.cardTwo],
        })
      }
      ties.push({
        id: participant.id,
        handName: participantHand.name,
        bestHand: participantHand.cards,
        winnerHand: [participant.cardOne, participant.cardTwo],
      })
    } // else, the winner is still the winner
  }
  if (ties.length > 0) {
    return ties
  }

  const res = [
    {
      id: winner.id,
      handName: winnerHand.name,
      bestHand: winnerHand.cards.map(card => unformatCards(card)),
      winnerHand: [
        unformatCards(winner.cardOne),
        unformatCards(winner.cardTwo),
      ],
    },
  ]

  return res
}

const sortHand = (cards: CustomCard[]) => {
  // sorts hand low to high by rank of cards. breaks ties arbitrarily
  cards.sort(function (a, b) {
    const aRank = +a.rank === 1 ? 14 : +a.rank
    const bRank = +b.rank === 1 ? 14 : +b.rank

    if (aRank == 1 || bRank == 1) {
      return bRank - aRank
    }
    return aRank - bRank
  })
  return cards as CustomCard[]
}

export const getBestHand = (cards: CustomCard[]): Hand => {
  // Of a list of 7 cards in 'CARDS', return the best hand possible. Assumes cards == length 7.
  let x

  x = hasRoyalFlush(cards)
  if (x.cards.length != 0) {
    return x
  }

  x = hasStraightFlush(cards)
  if (x.cards.length != 0) {
    return x
  }

  x = hasFourOfAKind(cards)
  if (x.cards.length != 0) {
    return x
  }
  x = hasFullHouse(cards)
  if (x.cards.length != 0) {
    return x
  }
  x = hasFlush(cards)
  if (x.cards.length != 0) {
    return x
  }

  x = hasStraight(cards)
  if (x.cards.length != 0) {
    return x
  }

  x = hasThreeOfAKind(cards)
  if (x.cards.length != 0) {
    return x
  }
  x = hasPairs(cards)
  if (x.cards.length != 0) {
    return x
  }

  return hasHighCard(cards)
}

const compareHands = (hand1: Hand, hand2: Hand) => {
  // Return 0 if hand1 is better, and 1 if hand2 is better.
  // Return -1 if they are the same.
  // Assumes they are both actually 5 card hands (lists of 5, objects with cards attributes)
  // with the name of the hand at the end of the hand
  var chn = compareHandNames(hand1.name, hand2.name)
  if (chn > -1) {
    return chn
  }
  var handName = hand1.name
  if (handName == 'High Card' || handName == 'Straight') {
    return forwardCompareRanks(hand1, hand2)
  } else if (
    handName == '1 Pair' ||
    handName == '2 Pair' ||
    handName == 'Three of a kind' ||
    handName == ''
  ) {
    return backwardCompareRanks(hand1, hand2)
  }
}

const forwardCompareRanks = (hand1: Hand, hand2: Hand) => {
  // Goes from highest card to lowest, comparing the hands.
  // Returns the same values as compareHands
  // Assumes same input as compareHands
  for (let i = 0; i < 5; i++) {
    const rankHand1 = +hand1.cards[i].rank === 1 ? 14 : +hand1.cards[i].rank
    const rankHand2 = +hand2.cards[i].rank === 1 ? 14 : +hand2.cards[i].rank

    if (rankHand1 > rankHand2) {
      return 0
    } else if (rankHand1 < rankHand2) {
      return 1
    }
  }
  return -1
}

const backwardCompareRanks = (hand1: Hand, hand2: Hand) => {
  // TODO: Special case for 1 Pair

  // Goes from last card to first, comparing the hands.
  // Returns the same values as compareHands
  // Assumes same input as compareHands
  let check = -1
  for (let i = 4; i >= 0; i--) {
    const rankHand1 = +hand1.cards[i].rank === 1 ? 14 : +hand1.cards[i].rank
    const rankHand2 = +hand2.cards[i].rank === 1 ? 14 : +hand2.cards[i].rank

    if (rankHand1 > rankHand2) {
      check = 0
    } else if (rankHand1 < rankHand2) {
      check = 1
    }
  }
  return check
}

/* The "has" methods below return the best hand of that category if it exists; otherwise, returns 0 
 They each assume that the hands better than them are not possible. */

const compareHandNames = (name1: string, name2: string) => {
  // Returns 0 if name1 is a better hand than name2
  // Returns 1 if name1 is a worse hand than name2
  // Returns -1 if they are the same
  if (name1 == name2) {
    return -1
  }

  if (name1 == 'High Card') {
    return 1
  } else if (name1 == '1 Pair') {
    if (name2 == 'High Card') {
      return 0
    } else {
      return 1
    }
  } else if (name1 == '2 Pair') {
    if (name2 == '1 Pair' || name2 == 'High Card') {
      return 0
    } else {
      return 1
    }
  } else if (name1 == 'Three of a kind') {
    if (name2 == '2 Pair' || name2 == '1 Pair' || name2 == 'High Card') {
      return 0
    } else {
      return 1
    }
  } else if (name1 == 'Straight') {
    if (
      name2 == '2 Pair' ||
      name2 == '1 Pair' ||
      name2 == 'High Card' ||
      name2 == 'Three of a kind'
    ) {
      return 0
    } else {
      return 1
    }
  } else if (name1 == 'Flush') {
    if (
      name2 == '2 Pair' ||
      name2 == '1 Pair' ||
      name2 == 'High Card' ||
      name2 == 'Three of a kind' ||
      name2 == 'Straight'
    ) {
      return 0
    } else {
      return 1
    }
  } else if (name1 == 'Full House') {
    if (
      name2 == '2 Pair' ||
      name2 == '1 Pair' ||
      name2 == 'High Card' ||
      name2 == 'Three of a kind' ||
      name2 == 'Straight' ||
      name2 == 'Flush'
    ) {
      return 0
    } else {
      return 1
    }
  } else if (name1 == 'Full House') {
    if (name2 == 'Four of a kind' || name2 == 'Straight Flush') {
      return 1
    } else {
      return 0
    }
  } else if (name1 == 'Four of a kind') {
    if (name2 == 'Straight Flush') {
      return 1
    } else {
      return 0
    }
  } else {
    return 0
  }
}

const hasHighCard = (cards: CustomCard[]): Hand => {
  // returns the largest cards in the hand, lowest to highest.
  // returns 5 items if cards.length > 5, or cards.length items if cards.length == 5
  const sortedCards = sortHand(cards)
  if (sortedCards.length > 5) {
    let hand = []
    for (let i = sortedCards.length - 1; i >= sortedCards.length - 5; i--) {
      hand.unshift(sortedCards[i]) // ensure low to high
    }
    return { cards: sortedCards, name: 'High Card' }
  } else {
    return { cards: sortedCards, name: 'High Card' }
  }
}

const hasPairs = (cards: CustomCard[]): Hand => {
  // returns the best hand with pairs (if they exists) in CARDS, 0 otherwise.
  // ex: will return 2 pairs and a high card if possible
  //     if not, will return 1 pair and 3 high cards if possible
  //     if not, returns 0
  // assumes there are no 3-of-a-kinds; hasThreeOfAKind should be called before this
  // assumes cards.length >= 5
  let hand = []
  let singletons = []
  let sortedCards = sortHand(cards)
  // reverse order to grab the best pairs first
  for (let i = sortedCards.length - 2; i >= 0; i--) {
    // add pairs
    if (sortedCards[i].rank == sortedCards[i + 1].rank) {
      hand.push(sortedCards[i])
      hand.push(sortedCards[i + 1])
      i--
      if (hand.length == 4) {
        // we found top two pairs, so we can break out, and treat the rest of the sortedCards as singles
        for (let j = i; j >= 0; j--) {
          singletons.push(sortedCards[j])
        }
        break
      }
      // keep track of values that don't make it to the top two pairs
    } else {
      singletons.push(sortedCards[i + 1])
    }
  }
  // no pairs were found
  if (hand.length == 0) {
    return { cards: [], name: '' }
  }
  // fill out the hands with high cards
  let numPairs = hand.length / 2
  let j = 0
  while (hand.length < 5) {
    // singleton is ordered high to low
    hand.push(singletons[j])
    j++
  }
  // hand.push(numPairs + ' Pair')
  return { cards: hand, name: numPairs + ' Pair' }
}

const hasThreeOfAKind = (cards: CustomCard[]): Hand => {
  // returns [triplet1, triplet2, triplet3, highcard1, highcard2] if there is a three of a kind in CARDS, 0 otherwise.
  // Assumes there is no full house in the hand.
  //     (if there were, hasFullHouse would find it first)
  let hand = []
  let singletons = []
  let sortedCards = sortHand(cards)
  for (let i = sortedCards.length - 3; i >= 0; i--) {
    // add the set if it exists
    if (
      sortedCards[i].rank == sortedCards[i + 1].rank &&
      sortedCards[i + 1].rank == sortedCards[i + 2].rank
    ) {
      hand.push(sortedCards[i])
      hand.push(sortedCards[i + 1])
      hand.push(sortedCards[i + 2])
      // we found a set, so we can break out, and treat the rest of the cards as singles
      for (let j = i - 1; j >= 0; j--) {
        singletons.push(sortedCards[j])
      }
      break
    } else {
      singletons.push(sortedCards[i + 2])
    }
  }
  // no sets were found
  if (hand.length == 0) {
    return { cards: [], name: '' }
  }
  // fill out the hands with high cards
  let j = 0
  while (hand.length < 5) {
    // singleton is ordered high to low
    hand.push(singletons[j])
    j++
  }
  // hand.push('Three of a kind')
  return { cards: hand, name: 'Three of a kind' }
}

const getUniqueRanks = (cards: CustomCard[]): CustomCard[] => {
  let uniqueRanks = cards.reduce((acc, item) => {
    if (!acc.has(item.rank)) acc.set(item.rank, item)
    return acc
  }, new Map())
  return Array.from(uniqueRanks.values())
}

const hasStraight = (cards: CustomCard[]): Hand => {
  const uniqueRanksCards = getUniqueRanks(cards)

  let sortedCards = sortHand(uniqueRanksCards).map(item => {
    if (item.rank === '1') return { ...item, rank: '14' }
    return item
  })

  let straights: CustomCard[][] = []
  let temp: CustomCard[] = [sortedCards[0]]

  for (let i = 1; i < sortedCards.length; i++) {
    let currentRank = parseInt(sortedCards[i].rank)
    let tempRank = parseInt(temp[temp.length - 1].rank)

    if (currentRank === tempRank + 1) {
      temp.push(sortedCards[i])
      if (temp.length === 5) {
        straights.push([...temp])
        temp.shift()
      }
    } else {
      if (temp.length >= 5) {
        straights.push([...temp])
      }
      temp = [sortedCards[i]]
    }
  }

  if (temp.length >= 5) {
    straights.push([...temp])
  }

  // Check for Ace-low straight
  if (
    sortedCards.some(card => card.rank === '14') &&
    sortedCards.some(card => card.rank === '2') &&
    sortedCards.some(card => card.rank === '3') &&
    sortedCards.some(card => card.rank === '4') &&
    sortedCards.some(card => card.rank === '5')
  ) {
    let aceLowStraight = sortedCards.filter(card =>
      ['14', '2', '3', '4', '5'].includes(card.rank)
    )

    const formattedStraight = aceLowStraight
      .reduce((acc, item) => {
        if (item.rank === '14') item = { ...item, rank: '1' }
        if (!acc.has(item.rank)) acc.set(item.rank, item)
        return acc
      }, new Map())
      .values()

    straights.push([...formattedStraight])
  }

  if (straights.length > 0) {
    // If there are multiple straights, return the highest one
    let highestStraight = straights.reduce((highest, current) => {
      let highestRank = parseInt(highest[4].rank)
      let currentRank = parseInt(current[4].rank)

      if (highestRank < currentRank) {
        return current
      } else {
        return highest
      }
    })

    const formatHighestStraight = highestStraight.map(item => {
      if (item.rank === '14') return { ...item, rank: '1' }
      return item
    })

    // console.log({ cards: formatHighestStraight, name: 'Straight' })
    return { cards: formatHighestStraight, name: 'Straight' }
  } else {
    return { cards: [], name: '' }
  }
}

const hasFlush = (cards: CustomCard[]): Hand => {
  // returns the largest flush possible, if it exists, 0 otherwise
  // if there are more than 5 cards of the same suit, takes the largest 5
  const suits = ['S', 'D', 'C', 'H']
  let sortedCards = sortHand(cards)
  for (let s in suits) {
    let currSuit = suits[s]
    let flushHand = [] as CustomCard[]
    // look at cards largest to smallest.
    for (let i = sortedCards.length - 1; i >= 0; i--) {
      // add cards to the flushHand if it is of currSuit
      if (sortedCards[i].suit == currSuit) {
        flushHand.push(sortedCards[i])
        // return the hand once we have 5 cards
        if (flushHand.length == 5) {
          // flushHand.push('Flush')
          return { cards: flushHand, name: 'Flush' }
        }
      }
    }
    if (flushHand.length >= 3) {
      // if only 3 or 4 of one suit, other suits cannot make flushes
      return { cards: [], name: '' }
    }
  }
  return { cards: [], name: '' }
}

const hasFullHouse = (cards: CustomCard[]): Hand => {
  // returns [triplet1, triplet2, triplet3, pair1, pair2] if the full house exists, otherwise 0
  // assumes no four of a kinds, as hasForOfAKind should handle that.
  let hand = []
  let remainder = []
  let sortedCards = sortHand(cards)
  for (let i = sortedCards.length - 3; i >= 0; i--) {
    // add the set if it exists
    if (
      sortedCards[i].rank == sortedCards[i + 1].rank &&
      sortedCards[i + 1].rank == sortedCards[i + 2].rank
    ) {
      hand.push(sortedCards[i])
      hand.push(sortedCards[i + 1])
      hand.push(sortedCards[i + 2])
      // we found a set, so we can break out, and collect the remaining sortedCards
      for (let j = i - 1; j >= 0; j--) {
        remainder.push(sortedCards[j])
      }
      break
    } else {
      remainder.push(sortedCards[i + 2])
    }
  }
  // no sets were found
  if (hand.length == 0) {
    return { cards: [], name: '' }
  }
  // find the best pair from the remainder
  // reverse order to grab the best pairs first
  for (let i = 0; i < remainder.length - 1; i++) {
    if (remainder[i].rank == remainder[i + 1].rank) {
      hand.push(remainder[i])
      hand.push(remainder[i + 1])
      break
    }
  }
  if (hand.length < 5) {
    return { cards: [], name: '' }
  }
  // hand.push('Full House')
  return { cards: hand, name: 'Full House' }
}

const hasFourOfAKind = (cards: CustomCard[]): Hand => {
  // returns [quadruplet1, quadruplet2, quadruplet3, quadruplet4, highcard1]
  let hand = []
  let remainder = []
  let sortedCards = sortHand(cards)
  for (let i = sortedCards.length - 4; i >= 0; i--) {
    // add the set if it exists
    if (
      sortedCards[i].rank == sortedCards[i + 1].rank &&
      sortedCards[i + 1].rank == sortedCards[i + 2].rank &&
      sortedCards[i + 2].rank == sortedCards[i + 3].rank
    ) {
      hand.push(sortedCards[i])
      hand.push(sortedCards[i + 1])
      hand.push(sortedCards[i + 2])
      hand.push(sortedCards[i + 3])
      // we found quads, so we can break out, and collect 1 more card for our high card
      remainder.push(sortedCards[i - 1])
      break
    } else {
      remainder.push(sortedCards[i + 3])
    }
  }
  // no sets were found
  if (hand.length == 0) {
    return { cards: [], name: '' }
  }
  // add the high card
  hand.push(remainder[0])
  // hand.push('Four of a kind')
  return { cards: hand, name: 'Four of a kind' }
}

const getHighestSuit = (cards: CustomCard[]): CustomCard[] => {
  let suits = ['H', 'D', 'S', 'C']
  let counts = suits.map(suit => {
    return cards.filter(card => card.suit == suit).length
  })
  let max = Math.max(...counts)
  let highestSuit = suits[counts.indexOf(max)]
  return cards.filter(card => card.suit == highestSuit)
}

const hasStraightFlush = (cards: CustomCard[]): Hand => {
  // 1, 2, 3, 4, 5 || 1, 13, 12, 11, 10

  const highestSuitCards = getHighestSuit(cards)

  if (highestSuitCards.length >= 5) {
    let straightFlushHand = hasStraight(highestSuitCards)
    if (straightFlushHand.cards.length === 5) {
      return { cards: straightFlushHand.cards, name: 'Straight Flush' }
    } else {
      return { cards: [], name: '' }
    }
  }
  return { cards: [], name: '' }
}

const hasRoyalFlush = (cards: CustomCard[]): Hand => {
  const highestSuitCards = getHighestSuit(cards)

  if (highestSuitCards.length >= 5) {
    let straightFlushHand = hasStraight(highestSuitCards)
    if (straightFlushHand.cards.length === 5) {
      const royalFlush = ['10', '11', '12', '13', '1']

      if (
        straightFlushHand.cards.every(
          (card, index) => card.rank === royalFlush[index]
        )
      ) {
        return { cards: straightFlushHand.cards, name: 'Royal Flush' }
      }

      return { cards: [], name: '' }
    } else {
      return { cards: [], name: '' }
    }
  }
  return { cards: [], name: '' }
}

export const getWinner2 = async (
  participants: ParticipantWithPlayerAndCards[]
) => {
  try {
    const gameType = 'texas'

    const currentMatch = await getMatchById(participants[0].matchId)

    if (!currentMatch) {
      return null
    }

    const formattedPaticipants = participants.map(participant => ({
      ...participant,
      cardOne: formatCardForSolver(participant.cardOne),
      cardTwo: formatCardForSolver(participant.cardTwo),
    }))

    const findHandOwner = (cards: PlayingCard[]) => {
      const participant = formattedPaticipants.find(participant => {
        return [participant.cardOne, participant.cardTwo].every(card =>
          cards.includes(card)
        )
      })
      return participant
    }

    const formattedBoard = currentMatch.board.map(item =>
      formatCardForSolver(item)
    ) as [PlayingCard, PlayingCard, PlayingCard, PlayingCard, PlayingCard]

    const res = rankHands(
      gameType,
      formattedBoard,
      formattedPaticipants.map(participant => [
        participant.cardOne,
        participant.cardTwo,
      ])
    )

    const highestRank = res.reduce(
      (minRank, player) => Math.min(minRank, player.rank),
      Infinity
    )

    const highestRankWinners = res
      .filter(winner => winner.rank === highestRank)
      .map(winner => {
        const participant = findHandOwner([
          ...winner.madeHand,
          ...winner.unused,
        ])
        return {
          id: participant?.id,
          playerId: participant?.playerId,
          handName: winner.combination,
          bestHand: `[${winner.madeHand.join(', ')}]`,
          winnerHand: `[${[participant?.cardOne, participant?.cardTwo].join(', ')}]`,
        }
      })

    return highestRankWinners
  } catch {
    return null
  }
}

export const getHighlightCardsForPlayer = (
  boardCards: CustomCard[],
  playerCards: CustomCard[]
): HighlightCard => {
  const bestHand = getBestHand([...boardCards, ...playerCards])

  bestHand.cards = bestHand.cards.filter(item => item !== undefined)

  const lastIndex = Math.max(bestHand.cards.length - 1, 0)
  if (bestHand.name === 'High Card') {
    const trueName = formatRankToGetHighlightName(
      bestHand.cards[lastIndex].rank
    )
    return { cards: [], name: `${trueName} 탑` }
  }

  if (bestHand.name === '1 Pair') {
    let cardCounts: { [key: string]: number } = {}

    for (let card of bestHand.cards) {
      if (cardCounts[card.rank]) {
        cardCounts[card.rank]++
      } else {
        cardCounts[card.rank] = 1
      }
    }

    for (let cardValue in cardCounts) {
      if (cardCounts[cardValue] === 2) {
        const cards = bestHand.cards.filter(card => card.rank === cardValue)

        const trueName = formatRankToGetHighlightName(cards[0].rank)
        const dataReturn = {
          cards: cards.map(card => unformatCards(card)),
          name: `원페어 ${trueName}`,
        }
        return dataReturn
      }
    }
  }

  if (bestHand.name === '2 Pair') {
    let cardCounts: { [key: string]: number } = {}
    let pairs: CustomCard[] = []

    for (let card of bestHand.cards) {
      if (cardCounts[card.rank]) {
        cardCounts[card.rank]++
      } else {
        cardCounts[card.rank] = 1
      }
    }

    for (let cardValue in cardCounts) {
      if (cardCounts[cardValue] === 2) {
        const cards = bestHand.cards.filter(card => card.rank === cardValue)
        pairs.push(...cards.map(card => unformatCards(card)))
      }
    }

    const dataReturn = {
      cards: pairs,
      name: '투페어',
    }
    return dataReturn
  }

  if (bestHand.name === 'Three of a kind') {
    let cardCounts: { [key: string]: number } = {}

    for (let card of bestHand.cards) {
      if (cardCounts[card.rank]) {
        cardCounts[card.rank]++
      } else {
        cardCounts[card.rank] = 1
      }
    }

    for (let cardValue in cardCounts) {
      if (cardCounts[cardValue] === 3) {
        const cards = bestHand.cards.filter(card => card.rank === cardValue)
        const trueName = formatRankToGetHighlightName(cards[0].rank)
        const dataReturn = {
          cards: cards.map(card => unformatCards(card)),
          name: `트리플 ${trueName}`,
        }
        return dataReturn
      }
    }
  }

  if (bestHand.name === 'Four of a kind') {
    let cardCounts: { [key: string]: number } = {}

    for (let card of bestHand.cards) {
      if (cardCounts[card.rank]) {
        cardCounts[card.rank]++
      } else {
        cardCounts[card.rank] = 1
      }
    }

    for (let cardValue in cardCounts) {
      if (cardCounts[cardValue] === 4) {
        const cards = bestHand.cards.filter(card => card.rank === cardValue)
        const trueName = formatRankToGetHighlightName(cards[0].rank)
        const dataReturn = {
          cards: cards.map(card => unformatCards(card)),
          name: `포카드 ${trueName}`,
        }
        return dataReturn
      }
    }
  }

  const otherFormattedName: { [key: string]: string } = {
    Straight: '스트레이트',
    Flush: '플러쉬',
    'Full House': '풀하우스',
    'Straight Flush': '스트레이트 플러쉬',
    'Royal Flush': '로얄 스트레이트 플러쉬',
  }

  return {
    cards: bestHand.cards.map(card => unformatCards(card)),
    name: otherFormattedName[bestHand.name] || bestHand.name,
  }

  // Logic to check the combination of cards for a specific player
  // Return an array of cards that need to be highlighted for this player
}
