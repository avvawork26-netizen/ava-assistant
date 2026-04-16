require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const db = require('./db');

console.log('Seeding Ava database...');

db.prepare('DELETE FROM followups').run();
db.prepare('DELETE FROM appointments').run();
db.prepare('DELETE FROM conversations').run();
db.prepare('DELETE FROM leads').run();
db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('leads','conversations','appointments','followups')").run();

const today = new Date();
const todayStr = today.toISOString().split('T')[0];

function daysFromNow(n) {
  return new Date(today.getTime() + n * 864e5).toISOString().split('T')[0];
}
function isoAgo(n) {
  return new Date(Date.now() - n * 864e5).toISOString();
}
function insertLead(d) {
  return db.prepare(`INSERT INTO leads (name,email,phone,source,intent,budget,timeline,area,pre_approval,status,urgency,escalation_ready,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    d.name,d.email,d.phone,d.source,d.intent,d.budget,d.timeline,d.area,d.pre_approval,d.status,d.urgency,d.escalation_ready||0,d.notes||null
  );
}
function msg(id,role,text){ db.prepare('INSERT INTO conversations (lead_id,role,message) VALUES (?,?,?)').run(id,role,text); }
function appt(id,date,time,type,notes){ db.prepare('INSERT INTO appointments (lead_id,date,time,type,notes) VALUES (?,?,?,?,?)').run(id,date,time,type,notes||null); }
function followup(id,date,template){ db.prepare('INSERT INTO followups (lead_id,scheduled_date,message_template) VALUES (?,?,?)').run(id,new Date(date).toISOString(),template); }

// 1. Maria Santos — HOT, pre-approved, Clearwater Beach
const maria = insertLead({name:'Maria Santos',email:'maria.santos@email.com',phone:'(407) 555-0182',source:'website',intent:'buy',budget:'$320k–$380k',timeline:'Within 60 days',area:'Clearwater Beach',pre_approval:'yes',status:'escalated',urgency:'hot',escalation_ready:1,notes:'Pre-approved buyer relocating from Chicago. 2BR condo, ocean views. Very motivated, wants to close before end of quarter.'});
msg(maria.lastInsertRowid,'user','Hi! I saw a listing on Zillow and wanted to learn more about condos in Clearwater Beach.');
msg(maria.lastInsertRowid,'assistant','Hi Maria! Great timing — Clearwater Beach is one of the most beautiful waterfront markets in Florida. Are you looking to buy or rent?');
msg(maria.lastInsertRowid,'user','Buying. Relocating from Chicago for work, need something in the next 60 days. Pre-approved up to $380k.');
msg(maria.lastInsertRowid,'assistant','You\'re perfectly positioned — pre-approved with a clear timeline. A 2BR with ocean views at $320–380k is very achievable on Clearwater Beach. I\'m flagging you as a priority for Ayoub right now. Does Wednesday at 10am work for an intro call?');
msg(maria.lastInsertRowid,'user','Wednesday 10am is perfect!');
msg(maria.lastInsertRowid,'assistant','Done — Ayoub will call Wednesday at 10am with listings that match exactly what you\'re looking for. You\'re going to love Clearwater, Maria.');
appt(maria.lastInsertRowid, todayStr, '10:00', 'consultation', 'Pre-approved $380k. 2BR ocean view condo. Relocating from Chicago, 60-day close needed.');

// 2. Jennifer Chen — HOT, NYC relocation, Lake Nona
const jennifer = insertLead({name:'Jennifer Chen',email:'jchen.nyc@proton.me',phone:'(646) 555-0319',source:'instagram',intent:'buy',budget:'$600k–$700k',timeline:'2–3 months',area:'Lake Nona',pre_approval:'yes',status:'escalated',urgency:'hot',escalation_ready:1,notes:'Family of 4 relocating from NYC. Pre-approved $700k. 4BR + pool. Lake Nona schools are critical. Ready to move fast.'});
msg(jennifer.lastInsertRowid,'user','Hello! Found Ayoub on Instagram. Family moving from NYC to Orlando — very interested in Lake Nona.');
msg(jennifer.lastInsertRowid,'assistant','Jennifer, welcome! Lake Nona is the best family community in central Florida — top schools, Medical City, gorgeous neighborhoods. Are you looking to buy?');
msg(jennifer.lastInsertRowid,'user','Yes. Two kids so schools are everything. Pre-approved $700k, need 4BR + pool, moving in 2–3 months.');
msg(jennifer.lastInsertRowid,'assistant','You\'re perfectly set up. 4BR with pool in Lake Nona at $700k has great options, and the schools are some of the best in Florida. I\'m flagging you for Ayoub immediately. Thursday or Friday afternoon for a call?');
msg(jennifer.lastInsertRowid,'user','Friday afternoon works perfectly.');
msg(jennifer.lastInsertRowid,'assistant','Friday afternoon confirmed. Ayoub will come with listings, school district maps, and a full relocation packet. He\'s helped dozens of families move from the northeast. Can\'t wait for you to see Lake Nona!');
appt(jennifer.lastInsertRowid, todayStr, '14:00', 'consultation', 'NYC relocation. Family of 4. Pre-approved $700k. 4BR + pool. Lake Nona schools critical. 2–3 months.');

// 3. Marcus Webb — HOT, Dr. Phillips luxury buyer, cash
const marcus = insertLead({name:'Marcus Webb',email:'marcus.webb@gmail.com',phone:'(407) 555-0934',source:'referral',intent:'buy',budget:'$800k–$1.1M',timeline:'30–45 days',area:'Dr. Phillips / Windermere',pre_approval:'yes',status:'escalated',urgency:'hot',escalation_ready:1,notes:'Cash buyer (surgeon at Orlando Health). 5BR, home office, 3-car garage, gated community. Serious and decisive. Referred by Dr. Patel.'});
msg(marcus.lastInsertRowid,'user','Hi, Dr. Patel referred me to Ayoub. Looking for a luxury home in Dr. Phillips or Windermere. Cash purchase.');
msg(marcus.lastInsertRowid,'assistant','Dr. Webb, welcome — a referral from Dr. Patel is always a pleasure! Dr. Phillips and Windermere are Ayoub\'s specialty for luxury. Cash purchase makes you extremely competitive. What are your must-haves?');
msg(marcus.lastInsertRowid,'user','5 bedrooms, dedicated home office, 3-car garage, gated community. Budget $800k–$1.1M. Need to be in within 45 days.');
msg(marcus.lastInsertRowid,'assistant','Cash buyer with that spec in Dr. Phillips or Windermere — you\'ll have excellent options. Several gated communities in that range fit your exact list. Ayoub is one of the top agents in that corridor. Can he call you tomorrow morning?');
msg(marcus.lastInsertRowid,'user','Tomorrow morning works. 9am is fine.');
appt(marcus.lastInsertRowid, daysFromNow(1), '09:00', 'consultation', 'Cash buyer. $800k–$1.1M. 5BR, home office, 3-car garage, gated. Dr. Phillips or Windermere. 45-day timeline.');

// 4. Sofia Reyes — HOT, St. Pete Beach condo
const sofia = insertLead({name:'Sofia Reyes',email:'sofia.reyes@icloud.com',phone:'(727) 555-0451',source:'website',intent:'buy',budget:'$425k–$525k',timeline:'Next 45 days',area:'St. Pete Beach',pre_approval:'yes',status:'active',urgency:'hot',escalation_ready:0,notes:'Pre-approved. 2–3BR condo, must allow short-term rentals. Motivated buyer, recent life change.'});
msg(sofia.lastInsertRowid,'user','Hi! Looking for a condo in St. Pete Beach, pre-approved and ready to move quickly.');
msg(sofia.lastInsertRowid,'assistant','Hi Sofia! St. Pete Beach is a wonderful choice — gorgeous Gulf views, vibrant community. What\'s your budget and size preference?');
msg(sofia.lastInsertRowid,'user','$425–525k, 2 or 3 bedrooms. Important: I want to Airbnb it occasionally. Does that cause HOA issues?');
msg(sofia.lastInsertRowid,'assistant','Critical question — some buildings prohibit short-term rentals entirely. Ayoub knows exactly which St. Pete Beach condos are Airbnb-friendly in your range. Pre-approved with clear budget — you\'re in great shape. Want him to send a curated shortlist today?');
msg(sofia.lastInsertRowid,'user','Yes please! That would be great.');
appt(sofia.lastInsertRowid, daysFromNow(1), '11:00', 'showing', 'Touring STR-friendly condos in St. Pete Beach. Pre-approved $525k. 2–3BR.');

// 5. James Wilson — WARM, sell Lake Nona + buy Tampa
const james = insertLead({name:'James Wilson',email:'jwilson@gmail.com',phone:'(321) 555-0441',source:'referral',intent:'sell',budget:'$450k–$550k',timeline:'3–6 months',area:'Lake Nona (selling) + Tampa (buying)',pre_approval:'in_progress',status:'active',urgency:'warm',escalation_ready:0,notes:'Sell Lake Nona home (~$480k) then buy in Tampa/St. Pete. Pre-approval in progress. Summer timeline.'});
msg(james.lastInsertRowid,'user','Friend referred me to Ayoub. Looking to sell in Lake Nona and buy something in Tampa area.');
msg(james.lastInsertRowid,'assistant','Welcome James! Lake Nona is very strong right now — Ayoub has sold several there recently. Sell first then buy, or trying to coordinate both?');
msg(james.lastInsertRowid,'user','Sell first. House probably worth $480k. Buying $450–550k in Tampa. Timeline is summer, June or July.');
msg(james.lastInsertRowid,'assistant','Smart move — selling first keeps financing clean. Lake Nona at $480k is realistic. Ayoub covers both markets which makes this easy. How\'s the pre-approval going?');
msg(james.lastInsertRowid,'user','Submitted last week, waiting to hear back.');
msg(james.lastInsertRowid,'assistant','Usually 3–5 business days. The moment it comes through, let Ayoub know and he\'ll get a full home valuation on your Lake Nona place scheduled right away. You\'re well on track for summer.');
followup(james.lastInsertRowid, isoAgo(1), 'day3');

// 6. Amanda Taylor — WARM, renter, Clearwater Beach
const amanda = insertLead({name:'Amanda Taylor',email:'ataylor@outlook.com',phone:'(813) 555-0563',source:'chat',intent:'rent',budget:'$2,800–$3,500/mo',timeline:'Next 30 days',area:'Clearwater Beach',pre_approval:'unknown',status:'active',urgency:'warm',escalation_ready:0,notes:'Moving with a 40lb dog. Wants walkable to beach. 6-month lease to start.'});
msg(amanda.lastInsertRowid,'user','Hey! Looking for a rental near Clearwater Beach. Do you handle rentals?');
msg(amanda.lastInsertRowid,'assistant','Hi Amanda! Ayoub works with rentals in the Clearwater area too. Long-term or seasonal?');
msg(amanda.lastInsertRowid,'user','6 months to start, maybe longer. Moving with my dog, need beach walkability. $2,800–3,500/mo, need to move in 30 days.');
msg(amanda.lastInsertRowid,'assistant','Totally doable — North Redington Beach and Sand Key are equally gorgeous and slightly less competitive than Clearwater Beach itself. Dog-friendly beach-walkable rentals exist at your budget. 30 days is tight but moveable if we act now. One dog — what size?');
msg(amanda.lastInsertRowid,'user','Medium, about 40 lbs.');
msg(amanda.lastInsertRowid,'assistant','Noted — 40 lbs. Some buildings cap at 25 lbs so I\'ll filter that upfront. Flagging for Ayoub now with your full spec. Expect to hear from him today.');
followup(amanda.lastInsertRowid, isoAgo(2), 'day1');

// 7. Kevin Park — WARM, Winter Park upsizer
const kevin = insertLead({name:'Kevin Park',email:'kpark.orlando@gmail.com',phone:'(407) 555-0218',source:'google',intent:'buy',budget:'$550k–$650k',timeline:'4–5 months',area:'Winter Park',pre_approval:'in_progress',status:'active',urgency:'warm',escalation_ready:0,notes:'Growing family, upsizing 3BR to 4BR+. Loves Winter Park for walkability and schools. Pre-approval in progress.'});
msg(kevin.lastInsertRowid,'user','Hi, we\'re looking to upsize to a bigger home in Winter Park. Need at least 4 bedrooms.');
msg(kevin.lastInsertRowid,'assistant','Hi Kevin! Winter Park is one of the most sought-after neighborhoods in the Orlando area — great walkability, beautiful tree-lined streets, A-rated schools. Budget and timeline?');
msg(kevin.lastInsertRowid,'user','$550–650k, 4+ bedrooms. Not rushing, 4–5 months. Getting pre-approval sorted now.');
msg(kevin.lastInsertRowid,'assistant','That budget has excellent inventory in Winter Park right now. Once pre-approval is confirmed, Ayoub will set up a curated tour. Any specific areas of Winter Park you love?');
msg(kevin.lastInsertRowid,'user','We love the Rollins College area and anything walkable to Park Ave.');
msg(kevin.lastInsertRowid,'assistant','Perfect — that area has beautiful brick homes and craftsman styles in your range. Ayoub knows every street there. He\'ll put together a tailored list once your pre-approval lands.');
followup(kevin.lastInsertRowid, daysFromNow(2), 'day3');

// 8. Rachel Torres — COLD, Dunedin investor
const rachel = insertLead({name:'Rachel Torres',email:'r.torres.invest@gmail.com',phone:'(305) 555-0812',source:'google',intent:'invest',budget:'$300k–$450k',timeline:'6–12 months',area:'Dunedin / Clearwater',pre_approval:'unknown',status:'active',urgency:'cold',escalation_ready:0,notes:'Exploring vacation rental investment. Needs education on HOA/STR rules. Good nurture candidate.'});
msg(rachel.lastInsertRowid,'user','Hi, thinking about a vacation rental in Clearwater/Dunedin for Airbnb. Is that market good?');
msg(rachel.lastInsertRowid,'assistant','Hi Rachel! Yes — Clearwater and Dunedin are among the strongest STR markets in Florida. The critical thing is finding buildings where HOAs allow short-term rentals. Budget range?');
msg(rachel.lastInsertRowid,'user','$300–450k. No rush, 6–12 months out, just researching.');
msg(rachel.lastInsertRowid,'assistant','Smart to do the homework first. At your range there are genuine options in Dunedin and select Clearwater condos that allow Airbnb. Ayoub can put together an investor overview with realistic cap rate estimates when you\'re ready — no pressure at all.');
followup(rachel.lastInsertRowid, daysFromNow(7), 'day7');

// 9. David Martinez — COLD, Gulf Coast investor
const david = insertLead({name:'David Martinez',email:'dmartinez.invest@gmail.com',phone:'(305) 555-0776',source:'google',intent:'invest',budget:'$250k–$400k',timeline:'6–12 months',area:'Gulf Coast / Clearwater',pre_approval:'unknown',status:'active',urgency:'cold',escalation_ready:0,notes:'Early-stage investor. No timeline. Needs nurturing. Good candidate for market update sequence.'});
msg(david.lastInsertRowid,'user','Hi, thinking about an Airbnb investment on the Gulf Coast. Worth it?');
msg(david.lastInsertRowid,'assistant','Hey David! Absolutely — the Gulf Coast is one of the top short-term rental markets in the country. Clearwater Beach alone sees 80%+ summer occupancy. Thinking pure investment or personal use too?');
msg(david.lastInsertRowid,'user','Mostly investment. No real timeline, just exploring. What budget do I need?');
msg(david.lastInsertRowid,'assistant','For a quality Clearwater Beach condo that performs well on Airbnb, $250k–$450k depending on size and water proximity. The big thing is finding STR-friendly buildings — not all are. Happy to have Ayoub send an investor overview whenever you\'re ready.');
followup(david.lastInsertRowid, daysFromNow(5), 'day7');

// 10. Patricia Lane — COLD, first-time buyer
const patricia = insertLead({name:'Patricia Lane',email:'plane.firsthome@gmail.com',phone:'(407) 555-0395',source:'chat',intent:'buy',budget:'$280k–$340k',timeline:'6+ months',area:'Orlando suburbs',pre_approval:'no',status:'active',urgency:'cold',escalation_ready:0,notes:'First-time buyer. Not pre-approved yet. Needs process guidance. Long timeline but engaged.'});
msg(patricia.lastInsertRowid,'user','Hi! I\'m a first-time homebuyer and not sure where to start. Can Ayoub help?');
msg(patricia.lastInsertRowid,'assistant','Hi Patricia! Ayoub loves working with first-time buyers — you\'ve come to the right place. Are you just starting to explore or do you have a timeline in mind?');
msg(patricia.lastInsertRowid,'user','Just starting. No pre-approval yet, not sure I understand the process. Budget around $280–340k, timeline maybe 6 months.');
msg(patricia.lastInsertRowid,'assistant','Six months is perfect — gives you time to get pre-approved and understand the market without rushing. Step 1 is pre-approval (free, takes a few days, no commitment). Once you have that number, Ayoub will walk you through everything in a first-time buyer consultation. Want me to send you a pre-approval checklist?');
msg(patricia.lastInsertRowid,'user','That would be really helpful, yes please!');
msg(patricia.lastInsertRowid,'assistant','Sending it now! And don\'t worry — every experienced homeowner started exactly where you are. Ayoub is patient with first-time buyers and will make sure you feel completely confident at every step.');
followup(patricia.lastInsertRowid, daysFromNow(1), 'day1');

const s = {
  leads: db.prepare('SELECT COUNT(*) as n FROM leads').get().n,
  convos: db.prepare('SELECT COUNT(*) as n FROM conversations').get().n,
  appts: db.prepare('SELECT COUNT(*) as n FROM appointments').get().n,
  fups: db.prepare('SELECT COUNT(*) as n FROM followups').get().n,
};
console.log(`Done: ${s.leads} leads, ${s.convos} messages, ${s.appts} appointments, ${s.fups} follow-ups`);
