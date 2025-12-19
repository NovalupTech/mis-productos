import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcryptjs from 'bcryptjs';
import { getCurrentCompanyId } from '@/lib/domain';
import crypto from 'crypto';

// Secret para firmar tokens (debería estar en .env)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

interface AuthRequest {
  email: string;
  password: string;
  domain?: string;
  companyId?: string;
}

/**
 * Genera un token JWT simple
 */
function generateToken(companyId: string, userId: string): string {
  const payload = {
    companyId,
    userId,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 horas
  };
  
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };
  
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Endpoint de autenticación para API de importación de productos
 * POST /api/products/import/auth
 * Body: { email, password, domain? o companyId? }
 */
export async function POST(request: NextRequest) {
  try {
    const body: AuthRequest = await request.json();
    const { email, password, domain, companyId: providedCompanyId } = body;

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, message: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Determinar companyId
    let companyId: string | null = null;
    
    if (providedCompanyId) {
      companyId = providedCompanyId;
    } else if (domain) {
      // Buscar company por domain
      const domainRecord = await prisma.domain.findFirst({
        where: { domain },
        include: { company: true },
      });
      
      if (!domainRecord) {
        return NextResponse.json(
          { ok: false, message: 'Dominio no encontrado' },
          { status: 404 }
        );
      }
      
      companyId = domainRecord.companyId;
    } else {
      // Intentar obtener del dominio actual
      companyId = await getCurrentCompanyId();
    }

    if (!companyId) {
      return NextResponse.json(
        { ok: false, message: 'No se pudo determinar la compañía. Proporciona domain o companyId' },
        { status: 400 }
      );
    }

    // Buscar usuario con role companyAdmin y el companyId correspondiente
    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        companyId: companyId,
        role: 'companyAdmin',
      },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, message: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Verificar contraseña
    if (!bcryptjs.compareSync(password, user.password ?? '')) {
      return NextResponse.json(
        { ok: false, message: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Generar token
    const token = generateToken(companyId, user.id);

    return NextResponse.json({
      ok: true,
      token,
      expiresIn: 86400, // 24 horas en segundos
      companyId,
    });
  } catch (error) {
    console.error('Error en autenticación API:', error);
    return NextResponse.json(
      { ok: false, message: 'Error al autenticar' },
      { status: 500 }
    );
  }
}
