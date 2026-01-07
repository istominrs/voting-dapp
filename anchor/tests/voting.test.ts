import { startAnchor } from 'solana-bankrun'
import { BankrunProvider } from 'anchor-bankrun'
import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { PublicKey } from '@solana/web3.js'
import { Voting } from '../target/types/voting'
import { BN } from 'bn.js'

const IDL = require('../target/idl/voting.json')

const votingAddress = new PublicKey('Count3AcZucFDPSFBAeHkQ6AvttieKUkyJ8HiQGhQwe')

describe('voting', () => {
  let context
  let provider
  let votingProgram: anchor.Program<Voting>

  beforeAll(async () => {
    context = await startAnchor('', [{ name: 'voting', programId: votingAddress }], [])
    provider = new BankrunProvider(context)

    votingProgram = new Program<Voting>(IDL, provider)
  })

  it('Initialize poll', async () => {
    await votingProgram.methods
      .initializePoll(new anchor.BN(1), 'What is your favorite NHL team?', new anchor.BN(0), new anchor.BN(1867809158))
      .rpc()

    const [pollAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8)],
      votingAddress,
    )

    const poll = await votingProgram.account.poll.fetch(pollAddress)

    expect(poll.pollId.toNumber()).toEqual(1)
    expect(poll.description).toEqual('What is your favorite NHL team?')
    expect(poll.pollStart.toNumber()).toBeLessThan(poll.pollEnd.toNumber())
  })

  it('Initialize candidate', async () => {
    await votingProgram.methods.initializeCandidate(new BN(1), 'Florida Panthers').rpc()
    await votingProgram.methods.initializeCandidate(new BN(1), 'Tampa Bay Lightning').rpc()

    const [floridaAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from('Florida Panthers')],
      votingAddress,
    )

    const floridaCandidate = await votingProgram.account.candidate.fetch(floridaAddress)

    expect(floridaCandidate.candidateName).toEqual('Florida Panthers')
    expect(floridaCandidate.candidateVotes.toNumber()).toEqual(0)

    const [tampaAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from('Tampa Bay Lightning')],
      votingAddress,
    )

    const tampaCandidate = await votingProgram.account.candidate.fetch(tampaAddress)

    expect(tampaCandidate.candidateName).toEqual('Tampa Bay Lightning')
    expect(tampaCandidate.candidateVotes.toNumber()).toEqual(0)

    const [pollAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8)],
      votingAddress,
    )

    const poll = await votingProgram.account.poll.fetch(pollAddress)

    expect(poll.candidateAmount.toNumber()).toEqual(2)
  })

  it('Vote', async () => {
    await votingProgram.methods.vote(new BN(1), 'Florida Panthers').rpc()

    const [floridaAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from('Florida Panthers')],
      votingAddress,
    )

    const floridaCandidate = await votingProgram.account.candidate.fetch(floridaAddress)

    expect(floridaCandidate.candidateVotes.toNumber()).toEqual(1)
  })
})
