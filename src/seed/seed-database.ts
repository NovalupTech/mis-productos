export const runtime = 'nodejs';
import 'dotenv/config';
import { initialData } from './seed';
import prisma from '../lib/prisma';
import { AttributeType } from '@prisma/client';
import bcryptjs from 'bcryptjs';

async function main() {
  console.log('🧹 Limpiando base de datos...');

  // Limpiar todas las tablas en orden (respetando foreign keys)
  await prisma.orderAddress.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productAttribute.deleteMany();
  await prisma.productTag.deleteMany();
  await prisma.product.deleteMany();
  await prisma.attributeValue.deleteMany();
  await prisma.attribute.deleteMany();
  await prisma.category.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.pageSection.deleteMany();
  await prisma.page.deleteMany();
  await prisma.companySocial.deleteMany();
  await prisma.companyConfig.deleteMany();
  await prisma.domain.deleteMany();
  await prisma.company.deleteMany();
  await prisma.userAddress.deleteMany();
  await prisma.user.deleteMany();
  await prisma.country.deleteMany();

  console.log('✅ Base de datos limpiada');

  const { companies, users, countries } = initialData;

  // 1. Crear países
  console.log('🌍 Creando países...');
  await prisma.country.createMany({ data: countries });
  console.log(`✅ ${countries.length} países creados`);

  // 2. Crear companies y sus datos relacionados (primero para tener los IDs)
  const companyMap = new Map<string, string>(); // Mapa nombre -> id
  for (const companyData of companies) {
    console.log(`\n🏢 Creando empresa: ${companyData.name}...`);

    // Crear la empresa
    const company = await prisma.company.create({
      data: {
        name: companyData.name,
        email: companyData.email,
        phone: companyData.phone,
        logo: companyData.logo,
      },
    });

    // Crear dominios de la empresa
    console.log(`  🌐 Creando ${companyData.domains.length} dominios...`);
    await Promise.all(
      companyData.domains.map((domain, index) =>
        prisma.domain.create({
          data: {
            domain,
            companyId: company.id,
            isPrimary: index === 0, // El primer dominio es el primario
          },
        })
      )
    );

    // Crear categorías de la empresa
    console.log(`  📁 Creando ${companyData.categories.length} categorías...`);
    const categories = await Promise.all(
      companyData.categories.map((name) =>
        prisma.category.create({
          data: {
            name,
            companyId: company.id,
          },
        })
      )
    );
    const categoryMap = new Map(categories.map((c) => [c.name, c.id]));

    // Crear atributos de la empresa
    console.log(`  🏷️  Creando ${companyData.attributes.length} atributos...`);
    const attributes = await Promise.all(
      companyData.attributes.map(async (attrData) => {
        const attribute = await prisma.attribute.create({
          data: {
            name: attrData.name,
            type: attrData.type as AttributeType,
            companyId: company.id,
          },
        });

        // Si el atributo es select o multiselect, crear sus valores
        if (attrData.values && attrData.values.length > 0) {
          await prisma.attributeValue.createMany({
            data: attrData.values.map((value) => ({
              value,
              attributeId: attribute.id,
            })),
          });
        }

        return attribute;
      })
    );
    const attributeMap = new Map(attributes.map((a) => [a.name, a]));

    // Cargar valores de atributos para usarlos después
    const attributeValuesMap = new Map<string, Map<string, string>>();
    for (const attr of attributes) {
      const values = await prisma.attributeValue.findMany({
        where: { attributeId: attr.id },
      });
      const valueMap = new Map(values.map((v) => [v.value, v.id]));
      attributeValuesMap.set(attr.name, valueMap);
    }

    // Crear tags únicos por compañía
    const allTags = new Set<string>();
    companyData.products.forEach((p) => {
      p.tags.forEach((tag) => allTags.add(tag));
    });

    const tagMap = new Map<string, string>();
    for (const tagName of allTags) {
      // Buscar o crear el tag (son únicos por compañía)
      let tag = await prisma.tag.findUnique({ 
        where: { 
          name_companyId: {
            name: tagName,
            companyId: company.id
          }
        } 
      });
      if (!tag) {
        tag = await prisma.tag.create({ 
          data: { 
            name: tagName,
            companyId: company.id
          } 
        });
      }
      tagMap.set(tagName, tag.id);
    }

    // Crear productos
    console.log(`  📦 Creando ${companyData.products.length} productos...`);
    for (const productData of companyData.products) {
      const categoryId = categoryMap.get(productData.category);
      if (!categoryId) {
        console.warn(`⚠️  Categoría "${productData.category}" no encontrada para producto "${productData.title}"`);
        continue;
      }

      // Crear el producto
      const product = await prisma.product.create({
        data: {
          title: productData.title,
          description: productData.description,
          price: productData.price,
          inStock: productData.inStock,
          slug: productData.slug,
          companyId: company.id,
          categoryId,
        },
      });

      // Crear imágenes del producto
      await prisma.productImage.createMany({
        data: productData.images.map((url) => ({
          url,
          productId: product.id,
        })),
      });

      // Crear tags del producto
      await prisma.productTag.createMany({
        data: productData.tags.map((tagName) => ({
          productId: product.id,
          tagId: tagMap.get(tagName)!,
        })),
      });

      // Crear atributos del producto
      for (const [attrName, attrValue] of Object.entries(productData.attributes)) {
        const attribute = attributeMap.get(attrName);
        if (!attribute) {
          console.warn(`⚠️  Atributo "${attrName}" no encontrado para producto "${productData.title}"`);
          continue;
        }

        // Determinar cómo guardar el valor según el tipo de atributo
        if (attribute.type === 'select' || attribute.type === 'multiselect') {
          // Para select/multiselect, usar AttributeValue
          const values = Array.isArray(attrValue) ? attrValue : [attrValue];
          const valueIds: string[] = [];

          for (const val of values) {
            const valueMap = attributeValuesMap.get(attrName);
            const valueId = valueMap?.get(String(val));
            if (valueId) {
              valueIds.push(valueId);
            }
          }

          // Crear ProductAttribute para cada valor (o uno solo si es select)
          if (attribute.type === 'select' && valueIds.length > 0) {
            await prisma.productAttribute.create({
              data: {
                productId: product.id,
                attributeId: attribute.id,
                attributeValueId: valueIds[0],
              },
            });
          } else if (attribute.type === 'multiselect') {
            await prisma.productAttribute.createMany({
              data: valueIds.map((valueId) => ({
                productId: product.id,
                attributeId: attribute.id,
                attributeValueId: valueId,
              })),
            });
          }
        } else if (attribute.type === 'text') {
          // Para text, guardar en valueText
          await prisma.productAttribute.create({
            data: {
              productId: product.id,
              attributeId: attribute.id,
              valueText: String(attrValue),
            },
          });
        } else if (attribute.type === 'number') {
          // Para number, guardar en valueNumber
          await prisma.productAttribute.create({
            data: {
              productId: product.id,
              attributeId: attribute.id,
              valueNumber: Number(attrValue),
            },
          });
        }
      }
    }

    // Crear páginas de la empresa
    console.log(`  📄 Creando páginas...`);
    
    // Página CATALOG (siempre se crea, enabled = true)
    await prisma.page.create({
      data: {
        companyId: company.id,
        type: 'CATALOG',
        slug: 'catalog',
        title: 'Catálogo',
        enabled: true,
        isLanding: true,
      },
    });

    // Página HOME (opcional, enabled = false)
    await prisma.page.create({
      data: {
        companyId: company.id,
        type: 'HOME',
        slug: 'home',
        title: 'Inicio',
        enabled: false,
        isLanding: false,
      },
    });

    // Página INFO (opcional, enabled = false)
    await prisma.page.create({
      data: {
        companyId: company.id,
        type: 'INFO',
        slug: 'info',
        title: 'Información',
        enabled: false,
        isLanding: false,
      },
    });

    // Crear redes sociales de la empresa
    if (companyData.socials && companyData.socials.length > 0) {
      console.log(`  📱 Creando ${companyData.socials.length} redes sociales...`);
      await prisma.companySocial.createMany({
        data: companyData.socials.map((social) => ({
          companyId: company.id,
          type: social.type,
          url: social.url,
          label: social.label,
          enabled: social.enabled ?? true,
          order: social.order ?? 0,
        })),
      });
    }

    // Crear configuración de la empresa
    if (companyData.config && companyData.config.length > 0) {
      console.log(`  ⚙️  Creando ${companyData.config.length} configuraciones...`);
      await prisma.companyConfig.createMany({
        data: companyData.config.map((cfg) => ({
          companyId: company.id,
          key: cfg.key,
          value: cfg.value,
        })),
      });
    }

    // Guardar el ID de la compañía en el mapa
    companyMap.set(companyData.name, company.id);

    console.log(`✅ Empresa "${companyData.name}" creada exitosamente`);
  }

  // 3. Crear usuarios (después de las compañías para poder asignar companyId)
  console.log('\n👤 Creando usuarios...');
  
  // Crear usuarios definidos en el seed
  for (const userData of users) {
    const userPayload: any = {
      email: userData.email,
      password: userData.password,
      name: userData.name,
      role: userData.role,
    };

    // Si el usuario es companyAdmin y tiene companyName, buscar el ID
    if (userData.role === 'companyAdmin' && userData.companyName) {
      const companyId = companyMap.get(userData.companyName);
      if (companyId) {
        userPayload.companyId = companyId;
      } else {
        console.warn(`⚠️  Compañía "${userData.companyName}" no encontrada para usuario "${userData.email}"`);
      }
    }

    await prisma.user.create({
      data: userPayload,
    });
  }
  
  // Crear un usuario companyAdmin automático para cada compañía que no tenga uno
  console.log('\n👤 Creando usuarios companyAdmin automáticos para cada compañía...');
  const existingCompanyAdmins = new Set<string>();
  
  // Obtener las compañías que ya tienen un companyAdmin definido
  for (const userData of users) {
    if (userData.role === 'companyAdmin' && userData.companyName) {
      existingCompanyAdmins.add(userData.companyName);
    }
  }
  
  // Crear un companyAdmin para cada compañía que no tenga uno
  for (const [companyName, companyId] of companyMap.entries()) {
    if (!existingCompanyAdmins.has(companyName)) {
      // Generar email basado en el nombre de la compañía
      const emailBase = companyName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remover acentos
        .replace(/[^a-z0-9]/g, '') // Remover caracteres especiales
        .substring(0, 20); // Limitar longitud
      
      const email = `${emailBase}@misproductos.shop`;
      const name = `Admin ${companyName}`;
      
      await prisma.user.create({
        data: {
          email,
          password: bcryptjs.hashSync('123456'), // Contraseña por defecto
          name,
          role: 'companyAdmin',
          companyId,
        },
      });
      
      console.log(`  ✅ Creado usuario companyAdmin: ${email} para "${companyName}"`);
    }
  }
  
  const totalUsers = users.length + (companyMap.size - existingCompanyAdmins.size);
  console.log(`✅ ${totalUsers} usuarios creados en total`);

  console.log('\n🎉 Base de datos sembrada exitosamente!');
  console.log(`\n📊 Resumen:`);
  console.log(`   - ${companies.length} empresas`);
  console.log(`   - ${companies.length * 3} páginas (${companies.length} CATALOG, ${companies.length} HOME, ${companies.length} INFO)`);
  console.log(`   - ${companies.reduce((acc, c) => acc + (c.socials?.length || 0), 0)} redes sociales`);
  console.log(`   - ${companies.reduce((acc, c) => acc + (c.config?.length || 0), 0)} configuraciones`);
  console.log(`   - ${companies.reduce((acc, c) => acc + c.categories.length, 0)} categorías`);
  console.log(`   - ${companies.reduce((acc, c) => acc + c.attributes.length, 0)} atributos`);
  console.log(`   - ${companies.reduce((acc, c) => acc + c.products.length, 0)} productos`);
  console.log(`   - ${users.length} usuarios`);
  console.log(`   - ${countries.length} países`);
}

(async () => {
  await main();
})();
