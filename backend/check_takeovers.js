const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const takeovers = await prisma.earlyTakeover.findMany({
    include: {
      company: true
    }
  });
  
  console.log('Gefundene Übernahmen:', takeovers.length);
  takeovers.forEach(t => {
    console.log(`- Firma: ${t.company.name}, Von: ${t.start_date} bis ${t.end_date}, Zeit: ${t.start_time}-${t.end_time}`);
  });
  
  await prisma.$disconnect();
})();
