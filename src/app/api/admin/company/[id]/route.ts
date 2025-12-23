import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '@/auth.config';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await middleware();
  const { id } = await params;

  // Solo permitir a usuarios con role "admin"
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json(
      { error: 'No autorizado' },
      { status: 401 }
    );
  }

  try {
    const company = await prisma.company.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        logo: true,
      }
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error('Error fetching company:', error);
    return NextResponse.json(
      { error: 'Error al obtener la empresa' },
      { status: 500 }
    );
  }
}

