import { MetadataRoute } from 'next'
 
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://gruppodirawda.it', // الدومين بتاعك
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    // لو عندك صفحات تانية مستقبلاً زي "معلومات عنا" بتضيفها هنا
  ]
}