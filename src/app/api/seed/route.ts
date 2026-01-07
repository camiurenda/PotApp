import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connection'
import { User } from '@/lib/db/models'
import { hashPassword } from '@/lib/auth'

export async function POST() {
  try {
    await connectDB()

    // Check if users already exist
    const existingUsers = await User.countDocuments()
    if (existingUsers >= 2) {
      return NextResponse.json({ 
        message: 'Los usuarios ya existen',
        users: await User.find({}, { password: 0 })
      })
    }

    // Create the two predefined users
    const password1 = await hashPassword(process.env.USER1_PASSWORD || 'password1')
    const password2 = await hashPassword(process.env.USER2_PASSWORD || 'password2')

    const user1Name = process.env.USER1_NAME || 'Usuario 1'
    const user2Name = process.env.USER2_NAME || 'Usuario 2'

    const users = await User.create([
      {
        name: user1Name,
        email: `${user1Name.toLowerCase().replace(/\s+/g, '')}@parejafinance.app`,
        password: password1,
      },
      {
        name: user2Name,
        email: `${user2Name.toLowerCase().replace(/\s+/g, '')}@parejafinance.app`,
        password: password2,
      },
    ])

    return NextResponse.json({
      success: true,
      message: 'Usuarios creados exitosamente',
      users: users.map(u => ({ id: u._id, name: u.name, email: u.email })),
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: 'Error al crear usuarios' },
      { status: 500 }
    )
  }
}
