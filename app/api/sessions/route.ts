import {currentUserFromToken,sessionTokenFromRequest} from '@/lib/auth';
import {prisma} from '@/lib/db';
import {listMySessions,listPublicSessions,serializeSession,sessionInclude} from '@/lib/sessions';

export async function GET(request:Request){
  const mine=new URL(request.url).searchParams.get('mine')==='1';
  const user=await currentUserFromToken(sessionTokenFromRequest(request));
  if(mine){if(!user)return Response.json({error:'Authentification requise.'},{status:401});return Response.json({sessions:await listMySessions(user.id)},{headers:{'Cache-Control':'no-store'}})}
  return Response.json({sessions:await listPublicSessions(user?.id)},{headers:{'Cache-Control':'no-store'}});
}

export async function POST(request:Request){
  const user=await currentUserFromToken(sessionTokenFromRequest(request));
  if(!user)return Response.json({error:'Authentification requise.'},{status:401});
  let input:{gameSlug?:string;startsAtUtc?:string;durationMinutes?:number;timezone?:string;maximumPlayers?:number;message?:string};
  try{input=await request.json()}catch{return Response.json({error:'Requête invalide.'},{status:400})}
  const startsAtUtc=new Date(input.startsAtUtc??'');const durationMinutes=Number(input.durationMinutes),maximumPlayers=Number(input.maximumPlayers);
  if(!input.gameSlug||Number.isNaN(startsAtUtc.getTime())||startsAtUtc<=new Date()||!input.timezone||durationMinutes<30||durationMinutes>720||maximumPlayers<2||maximumPlayers>16)return Response.json({error:'Vérifiez les champs de la session.'},{status:400});
  const game=await prisma.game.findFirst({where:{slug:input.gameSlug,published:true}});if(!game)return Response.json({error:'Jeu introuvable.'},{status:404});
  const message=input.message?.trim()||null;if(message&&message.length>500)return Response.json({error:'Le message ne peut pas dépasser 500 caractères.'},{status:400});
  const session=await prisma.$transaction(async tx=>{const created=await tx.gameSession.create({data:{gameId:game.id,hostId:user.id,startsAtUtc,durationMinutes,timezoneAtCreation:input.timezone!,locationType:'online',message,minPlayers:2,maxPlayers:maximumPlayers,visibility:'PUBLIC'}});await tx.sessionParticipant.create({data:{sessionId:created.id,userId:user.id,status:'JOINED'}});return tx.gameSession.findUniqueOrThrow({where:{id:created.id},include:sessionInclude})});
  return Response.json({success:true,session:serializeSession(session,user.id)},{status:201,headers:{'Cache-Control':'no-store'}});
}
