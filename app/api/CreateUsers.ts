import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from "@/lib/prisma"
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { username, walletAddress } = req.body;

    if (!username || !walletAddress) {
      return res.status(400).json({ error: 'Username and wallet address are required.' });
    }

    try {
      const user = await prisma.user.create({
        data: {
          username,
          walletAddress,
        },
      });

      return res.status(201).json(user);
    } catch (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({ error: 'Failed to create user.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed.` });
  }
}