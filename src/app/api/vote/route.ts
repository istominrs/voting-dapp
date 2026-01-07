import { BN, Program } from '@coral-xyz/anchor'
import { ActionGetResponse, ActionPostRequest, ACTIONS_CORS_HEADERS, createPostResponse } from '@solana/actions'
import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import { Voting } from '@/../anchor/target/types/voting'

const IDL = require('@/../anchor/target/idl/voting.json')

export const OPTIONS = GET

export async function GET(request: Request) {
  const actionMetadata: ActionGetResponse = {
    icon: 'https://i0.wp.com/www.litterboxcats.com/wp-content/uploads/sites/15/2023/09/TBLcroppedGT-image.jpg?resize=912%2C385&ssl=1',
    title: 'Who is gonna to win next game?',
    description: 'Vote between Florida Panthers and Tampa Bay Lightning',
    label: 'Vote',
    links: {
      actions: [
        {
          label: 'Vote for Florida',
          href: '/api/vote?candidate=Florida',
          type: 'post',
        },
        {
          label: 'Vote for Tampa',
          href: '/api/vote?candidate=Tampa',
          type: 'post',
        },
      ],
    },
  }

  return Response.json(actionMetadata, { headers: ACTIONS_CORS_HEADERS })
}

export async function POST(request: Request) {
  const url = new URL(request.url)
  const candidate = url.searchParams.get('candidate')

  if (candidate != 'Florida' && candidate != 'Tampa') {
    return new Response('Invalid candidate', { status: 400, headers: ACTIONS_CORS_HEADERS })
  }

  const connection = new Connection('http://127.0.0.1:8899', 'confirmed')
  const program: Program<Voting> = new Program(IDL, { connection })

  const body: ActionPostRequest = await request.json()
  let voter: PublicKey

  try {
    voter = new PublicKey(body.account)
  } catch (err) {
    return new Response('Invalid account', { status: 400, headers: ACTIONS_CORS_HEADERS })
  }

  const instruction = await program.methods.vote(new BN(1), candidate).accounts({ signer: voter }).instruction()

  const blockhash = await connection.getLatestBlockhash()

  const transaction = new Transaction({
    feePayer: voter,
    blockhash: blockhash.blockhash,
    lastValidBlockHeight: blockhash.lastValidBlockHeight,
  }).add(instruction)

  const response = await createPostResponse({
    fields: {
      type: 'transaction',
      transaction: transaction,
    },
  })

  return Response.json(response, { headers: ACTIONS_CORS_HEADERS })
}
