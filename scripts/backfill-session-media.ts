import {PrismaClient} from '@prisma/client';
import games from '../data/normalized/megadrive-games.json';
const prisma=new PrismaClient();let updated=0,missing=0;
for(const game of games){const result=await prisma.game.updateMany({where:{slug:game.slug},data:{coverUrl:game.coverUrl??null,coverWebpPath:game.coverPath??game.coverUrl??null,coverSourceName:game.coverSourceFilename??game.coverSource??null,sourceConfidence:game.sourceConfidence??null,teamPlayerCompatible:game.teamPlayerCompatible??null}});if(result.count)updated+=result.count;else missing++}
console.log(JSON.stringify({updated,missing}));await prisma.$disconnect();
