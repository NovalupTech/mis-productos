export const revalidate = 600000; //7 dias aprox

import { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { ProductMobileSlideShow, ProductSlideShow, StockLabel, DiscountBadge } from "@/components";
import { getProductBySlug } from "@/actions/product/get-product-by-slug";
import { titleFont } from "@/config/fonts";
import { AddToCart } from "./ui/AddToCart";
import { getCurrentCompanyId } from '@/lib/domain';
import { getCompanyConfigPublic } from '@/actions';
import { getPriceConfig, formatPrice } from '@/utils';
import { PriceConfig } from "@/utils/priceFormat";
import { ProductDiscountInfo } from "./ui/ProductDiscountInfo";
import { BackToCatalogButton } from "./ui/BackToCatalogButton";
import { ShareButton } from "./ui/ShareButton";

interface Props {
  params: {
    slug: string;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  
  const {slug} = await params;
  // read route params
  // fetch data
  const product = await getProductBySlug({slug});

  if (!product) {
    return {
      title: 'Producto no encontrado',
      description: 'El producto que buscas no existe',
    };
  }

  // Obtener la URL base del sitio
  const headersList = await headers();
  const host = headersList.get('host') || headersList.get('x-forwarded-host');
  // Detectar el protocolo: usar x-forwarded-proto si está disponible (proxies/CDNs), 
  // o determinar según el entorno
  const forwardedProto = headersList.get('x-forwarded-proto');
  const protocol = forwardedProto || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  const baseUrl = host ? `${protocol}://${host}` : '';

  // Obtener la primera imagen del producto (o la segunda si existe)
  const productImage = product.images?.[0] || product.images?.[1];
  
  // Construir la URL absoluta de la imagen
  let imageUrl = '';
  if (productImage) {
    if (productImage.startsWith('http') || productImage.startsWith('https')) {
      // Si ya es una URL completa (Cloudinary), usarla directamente
      imageUrl = productImage;
    } else {
      // Si es relativa, construir la URL absoluta
      imageUrl = baseUrl ? `${baseUrl}/products/${productImage}` : `/products/${productImage}`;
    }
  }

  return {
    title: product.title,
    description: product.description || product.title,
    openGraph: {
      title: product.title,
      description: product.description || product.title,
      images: imageUrl ? [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: product.title,
        }
      ] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.title,
      description: product.description || product.title,
      images: imageUrl ? [imageUrl] : [],
    },
  }
}


export default async function ProductPage({params}: {params: Promise<{slug: string}>}) {

  const {slug} = await params;
  const product = await getProductBySlug({slug});

  if(!product)
    notFound();

  // Obtener configuración de precios y stock
  const companyId = await getCurrentCompanyId();
  let priceConfig: PriceConfig = { currency: 'USD', format: 'symbol-before', showPrices: true, decimals: 2 };
  let stockConfig = {
    showInDetails: true,
    showLowStockMessage: true,
    lowStockThreshold: 5,
  };
  
  if (companyId) {
    const { configs } = await getCompanyConfigPublic(companyId);
    if (configs && typeof configs === 'object' && !Array.isArray(configs)) {  
      const configsRecord: Record<string, any> = configs as Record<string, any>;
      priceConfig = getPriceConfig(configsRecord) as PriceConfig;
      
      // Obtener configuraciones de stock con valores por defecto
      stockConfig = {
        showInDetails: configsRecord['stock.showInDetails'] !== undefined 
          ? Boolean(configsRecord['stock.showInDetails']) 
          : true,
        showLowStockMessage: configsRecord['stock.showLowStockMessage'] !== undefined 
          ? Boolean(configsRecord['stock.showLowStockMessage']) 
          : true,
        lowStockThreshold: configsRecord['stock.lowStockThreshold'] !== undefined 
          ? Number(configsRecord['stock.lowStockThreshold']) 
          : 5,
      };
    }
  }
  const formattedPrice = formatPrice(product.price, priceConfig);

  return (
    <div className="flex flex-col md:flex-row mt-10 mb-20 gap-4 md:gap-6 max-w-5xl mx-auto px-4">
      {/* Botones para volver al catálogo y compartir - Mobile */}
      <div className="w-full md:hidden flex gap-2">
        <BackToCatalogButton />
        <ShareButton productTitle={product.title} productDescription={product.description} />
      </div>

      {/* Desktop Slideshow */}
      <div className="flex-shrink-0 md:w-[45%] relative">
        <ProductSlideShow images={product.images} title={product.title} slug={slug} className="hidden md:block"/>
        <ProductMobileSlideShow images={product.images} title={product.title} slug={slug} className="block md:hidden" />
        {/* Badge de descuento en la imagen */}
        <ProductDiscountInfo product={product} />
      </div>

      {/* Product Details */}
      <div className="flex-1 md:w-[55%] px-0 md:pl-6">
        {/* Botones para volver al catálogo y compartir - Desktop */}
        <div className="hidden md:flex md:gap-2 mb-4">
          <BackToCatalogButton />
          <ShareButton productTitle={product.title} productDescription={product.description} />
        </div>

        {stockConfig.showInDetails && <StockLabel slug={slug} />}

        <h1 className={`${titleFont.className} antialiased font-bold text-xl`}>
          {product.title}
        </h1>
        
        {/* Precio con descuento */}
        <ProductDiscountInfo product={product} priceConfig={priceConfig} showPrice />

        <AddToCart 
          product={product} 
          stockConfig={stockConfig}
        />

        {/* Descripción */}
        <h3 className="font-bold text-sm">Descripcion</h3>
        <p className="font-light">{product.description}</p>
      </div>
    </div>
  );
}