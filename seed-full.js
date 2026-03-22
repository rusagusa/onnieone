require('dotenv').config();
const db = require('./config/database');

console.log('🔥 ONNIEONE NEWS — Full Content Seeder');
console.log('========================================');

// Wait for DB to initialize
setTimeout(() => {

    // Clear existing content (keep users & categories)
    const tables = ['articles', 'breaking_news', 'advertisements', 'announcements', 'auction_news', 'today_history', 'real_time_updates'];
    tables.forEach(t => db.run(`DELETE FROM ${t}`));

    // ==================== CATEGORIES (reset & expand) ====================
    db.run('DELETE FROM categories');
    console.log('Seeding Categories...');
    const categories = [
        ['Politics', 'politics', 'fas fa-landmark', 1],
        ['Rwanda', 'rwanda', 'fas fa-flag', 2],
        ['Sports', 'sports', 'fas fa-futbol', 3],
        ['Entertainment', 'entertainment', 'fas fa-music', 4],
        ['Business', 'business', 'fas fa-chart-line', 5],
        ['Technology', 'technology', 'fas fa-microchip', 6],
        ['Health', 'health', 'fas fa-heartbeat', 7],
        ['Diaspora', 'diaspora', 'fas fa-globe-africa', 8],
        ['Tourism', 'tourism', 'fas fa-mountain', 9],
        ['Culture', 'culture', 'fas fa-theater-masks', 10],
        ['Environment', 'environment', 'fas fa-leaf', 11],
        ['Education', 'education', 'fas fa-graduation-cap', 12],
    ];
    categories.forEach(c => {
        db.run('INSERT INTO categories (name_en, slug, icon, order_position, is_active) VALUES (?,?,?,?,1)', c);
    });

    // ==================== ARTICLES (30+ realistic) ====================
    console.log('Seeding Articles...');
    const articles = [
        // Politics (cat 1)
        ['President Kagame Addresses Harvard University on Rwanda\'s Transformation', 'In a landmark speech at Harvard Kennedy School, President Paul Kagame shared Rwanda\'s development journey over the past three decades. He highlighted how the nation has transformed from the ashes of the 1994 genocide against the Tutsi into one of Africa\'s most dynamic economies. "We chose to build rather than destroy, to unite rather than divide," Kagame told the audience of scholars and policy makers. The speech covered topics ranging from digital governance and healthcare innovation to Rwanda\'s role in continental peacekeeping.', 1, 'https://picsum.photos/800/500?random=101', 1, 1, 'President Kagame shared Rwanda\'s transformation story at Harvard Kennedy School.'],
        ['Parliament Passes New Digital Economy Bill', 'The Rwandan Parliament has unanimously passed the Digital Economy Acceleration Bill, which aims to position Rwanda as Africa\'s leading tech hub by 2030. The bill includes provisions for tax incentives for tech startups, digital literacy programs in all schools, and the establishment of three new innovation hubs across the country. Minister of ICT described it as "a watershed moment for Rwanda\'s digital future."', 1, 'https://picsum.photos/800/500?random=102', 0, 0, 'Rwanda\'s Parliament passes landmark legislation to accelerate digital transformation.'],
        ['East African Community Summit Concludes with Trade Agreements', 'Leaders from the East African Community member states concluded a three-day summit in Kigali with the signing of five major trade agreements aimed at reducing cross-border tariffs and boosting intra-regional commerce. The summit addressed key challenges including currency harmonization, infrastructure development, and joint security initiatives.', 1, 'https://picsum.photos/800/500?random=103', 1, 0, 'EAC leaders sign five trade agreements at Kigali summit.'],

        // Rwanda (cat 2)
        ['Kigali Named Africa\'s Cleanest City for Fifth Consecutive Year', 'Kigali has been named Africa\'s cleanest city for the fifth year in a row by the UN-Habitat Clean Cities Index. The recognition highlights Rwanda\'s famous Umuganda community service program, strict plastic bag bans, and innovative waste management systems. Mayor Pudence Rubingisa credited citizens\' dedication to cleanliness and environmental stewardship.', 2, 'https://picsum.photos/800/500?random=104', 1, 1, 'UN-Habitat recognizes Kigali as Africa\'s cleanest city again.'],
        ['520,000 Residents in Rubavu Now Have Access to Clean Water', 'A major infrastructure project in Rubavu District has been completed, providing clean drinking water to over 520,000 residents. The $45 million project, funded through a partnership between the Government of Rwanda and the World Bank, includes 12 new water treatment facilities and over 300 kilometers of distribution pipelines.', 2, 'https://picsum.photos/800/500?random=105', 0, 0, 'Major water infrastructure project completed in Rubavu District.'],
        ['Rwanda Revenue Authority Reports Record Tax Collection', 'RRA has reported a 15% increase in tax revenue collection for the first quarter of 2026, surpassing targets by 8%. The authority attributed the success to digital transformation of tax services, including the new e-filing platform that has seen 92% adoption among registered taxpayers.', 2, 'https://picsum.photos/800/500?random=106', 0, 0, 'Tax revenue surpasses quarterly targets by 8%.'],
        ['New International Airport in Bugesera Reaches 80% Completion', 'Construction of the Bugesera International Airport has reached 80% completion, with officials confirming the facility remains on track for its 2027 opening. The airport will have capacity to handle 7 million passengers annually and serve as a regional aviation hub for East Africa.', 2, 'https://picsum.photos/800/500?random=107', 1, 0, 'Bugesera International Airport construction progresses on schedule.'],

        // Sports (cat 3)
        ['APR FC Returns to Top of Rwanda Premier League After Dominant Victory', 'APR FC reclaimed the top spot in the Rwanda Premier League standings with a convincing 3-0 victory over Amagaju FC at Amahoro Stadium. Goals from Muhadjiri Hakizimana, Kevin Muhire, and a spectacular free kick by Jean-Claude Iranzi sealed the win in front of 25,000 fans. Head coach Adil Mohammed praised the team\'s discipline and attacking cohesion.', 3, 'https://picsum.photos/800/500?random=108', 1, 1, 'APR FC beat Amagaju FC 3-0 to reclaim league summit.'],
        ['Rwanda Cricket Team Makes History at International Tournament', 'The Rwanda national cricket team has made history by qualifying for the ICC T20 World Cup qualifier for the first time. Captain Fanny Utagushimaninde led the team to three consecutive victories in the Africa regional qualifiers held in Nairobi, Kenya.', 3, 'https://picsum.photos/800/500?random=109', 0, 0, 'Rwanda cricket qualifies for ICC T20 World Cup qualifier.'],
        ['Tour du Rwanda 2026 Attracts Record International Participation', 'The 2026 Tour du Rwanda cycling race has attracted a record 24 international teams from 18 countries. The eight-stage race, covering 1,200 kilometers across Rwanda\'s scenic landscapes, has become one of Africa\'s premier cycling events. Organizers expect over 500,000 spectators across all stages.', 3, 'https://picsum.photos/800/500?random=110', 0, 0, 'Record 24 international teams registered for Tour du Rwanda.'],
        ['Rwandan Basketball Star Signs Deal with European Club', 'Point guard Diane Shima has signed a two-year contract with Spanish basketball club Valencia Basket, becoming the first Rwandan woman to play in the Liga Femenina. The 23-year-old starred at the University of Memphis before being recruited by several European clubs.', 3, 'https://picsum.photos/800/500?random=111', 0, 0, 'Diane Shima becomes first Rwandan in Spanish Liga Femenina.'],

        // Entertainment (cat 4)
        ['Meddy Announces East African Tour with 9 Dates', 'Rwandan music sensation Medardus "Meddy" Ngabo has announced a nine-city East African tour starting in April 2026. The "Adi" hitmaker will perform in Kigali, Kampala, Nairobi, Dar es Salaam, Bujumbura, Juba, Mombasa, Arusha, and Kisumu. All Kigali shows at BK Arena are already sold out.', 4, 'https://picsum.photos/800/500?random=112', 1, 0, 'Meddy announces sold-out East African concert tour.'],
        ['Siga Art Festival Draws Thousands to Kigali Convention Centre', 'The annual Siga Art Festival concluded with record attendance of over 15,000 visitors at the Kigali Convention Centre. The three-day festival featured live music from Massamba, Riderman, and Juno Kizigenza, alongside art exhibitions, poetry readings, and fashion shows celebrating Rwandan creativity.', 4, 'https://picsum.photos/800/500?random=113', 0, 0, 'Siga Art Festival sets new attendance record in Kigali.'],
        ['Rwandan Film "Umuhango" Selected for Cannes Film Festival', 'Director Joel Karekezi\'s latest film "Umuhango" has been selected for the prestigious Un Certain Regard section at the 2026 Cannes Film Festival. The film tells the story of a young woman navigating tradition and modernity in contemporary Kigali. It marks the second time a Rwandan film has been featured at Cannes.', 4, 'https://picsum.photos/800/500?random=114', 1, 0, 'Rwandan film "Umuhango" selected for Cannes Un Certain Regard.'],
        ['Miss Rwanda 2026 Crowned in Spectacular Ceremony', 'Uwase Clarisse, a 22-year-old engineering student from Huye, was crowned Miss Rwanda 2026 in a ceremony at BK Arena. She impressed judges with her advocacy platform focused on STEM education for girls in rural communities. The event featured performances by top Rwandan artists and was attended by over 10,000 guests.', 4, 'https://picsum.photos/800/500?random=115', 0, 0, 'Uwase Clarisse crowned Miss Rwanda 2026 at BK Arena ceremony.'],

        // Business (cat 5)
        ['Rwanda\'s GDP Growth Hits 9.1% in Q1 2026', 'Rwanda\'s economy surged by 9.1% in the first quarter of 2026, driven by strong performances in the services, construction, and agriculture sectors. The National Institute of Statistics reported that the services sector grew by 12%, led by tourism and information technology. Finance Minister Uzziel Ndagijimana described the growth as "evidence that our economic diversification strategy is working."', 5, 'https://picsum.photos/800/500?random=116', 1, 1, 'Rwanda posts 9.1% GDP growth in Q1 2026.'],
        ['Kigali Innovation City Attracts $200M in Foreign Investment', 'The Kigali Innovation City development has attracted over $200 million in committed foreign direct investment from technology companies across North America, Europe, and Asia. The 60-hectare campus, being developed in partnership with Carnegie Mellon University Africa, is expected to create 50,000 jobs by 2030.', 5, 'https://picsum.photos/800/500?random=117', 0, 0, 'Kigali Innovation City secures $200M in tech investment.'],
        ['Bank of Kigali Reports 23% Profit Increase', 'Bank of Kigali, Rwanda\'s largest commercial bank, reported a 23% increase in net profit for FY2025, reaching RWF 52.3 billion. The bank credited its digital banking transformation and expansion of mobile banking services across all 30 districts for the strong performance.', 5, 'https://picsum.photos/800/500?random=118', 0, 0, 'Bank of Kigali posts record profits driven by digital banking.'],

        // Technology (cat 6)
        ['Rwanda Launches Africa\'s First 6G Research Lab', 'Rwanda has inaugurated Africa\'s first 6G research laboratory at the African Institute of Mathematical Sciences in Kigali. The $15 million facility, built in partnership with Samsung and the Korean government, will research next-generation wireless technologies and train 200 Rwandan engineers in advanced telecommunications.', 6, 'https://picsum.photos/800/500?random=119', 1, 0, 'Africa\'s first 6G research lab opens in Kigali.'],
        ['Zipline Completes 1 Million Medical Deliveries by Drone in Rwanda', 'Zipline, the drone delivery company that began operations in Rwanda in 2016, has completed its one-millionth medical delivery. The company\'s fleet of autonomous drones has delivered blood, vaccines, and medications to over 2,500 health facilities across the country, saving an estimated 10,000 lives.', 6, 'https://picsum.photos/800/500?random=120', 0, 0, 'Zipline reaches 1 million drone deliveries milestone in Rwanda.'],
        ['Irembo Digital Platform Reaches 5 Million Active Users', 'Rwanda\'s e-government platform Irembo has surpassed 5 million active users, with over 100 government services now available online. The platform processes an average of 50,000 transactions daily, ranging from birth certificate applications to business registrations.', 6, 'https://picsum.photos/800/500?random=121', 0, 0, 'E-government platform Irembo hits 5 million users.'],

        // Health (cat 7)
        ['Rwanda Achieves 95% Vaccination Rate for Children Under Five', 'Rwanda has achieved a 95% vaccination coverage rate for children under five, one of the highest in Africa. The Ministry of Health attributed the success to community health workers (Abajyanama b\'Ubuzima) who conduct door-to-door vaccination campaigns in every village across the country.', 7, 'https://picsum.photos/800/500?random=122', 1, 0, 'Rwanda reaches 95% child vaccination coverage.'],
        ['New Cancer Treatment Center Opens at CHUK Hospital', 'A state-of-the-art cancer treatment center has opened at the Centre Hospitalier Universitaire de Kigali (CHUK), equipped with the latest radiation therapy and chemotherapy technologies. The $30 million facility was built with support from Partners in Health and will serve patients from across the East African region.', 7, 'https://picsum.photos/800/500?random=123', 0, 0, 'CHUK opens $30M cancer treatment center.'],

        // Diaspora (cat 8)
        ['Rwandan Diaspora Convention Attracts 3,000 Attendees in London', 'The annual Rwanda Diaspora Global Convention held in London attracted over 3,000 attendees from 45 countries. The three-day event focused on investment opportunities, cultural exchange, and diaspora contributions to national development. Several investment pledges totaling $150 million were announced.', 8, 'https://picsum.photos/800/500?random=124', 0, 0, 'Rwanda Diaspora Convention draws 3,000 to London.'],

        // Tourism (cat 9)
        ['Gorilla Population in Volcanoes National Park Exceeds 1,100', 'The latest census of mountain gorillas in Volcanoes National Park has recorded over 1,100 individuals, marking a significant conservation success. The gorilla population has more than doubled since 2000, thanks to Rwanda\'s intensive conservation efforts and the revenue generated by eco-tourism.', 9, 'https://picsum.photos/800/500?random=125', 1, 0, 'Mountain gorilla population exceeds 1,100 in Rwanda.'],
        ['Akagera National Park Named Best Safari Destination in East Africa', 'Akagera National Park has been named the Best Safari Destination in East Africa by World Travel Awards 2026. The park, which was nearly defunct two decades ago, is now home to the Big Five after successful reintroductions of lions, rhinos, and elephants.', 9, 'https://picsum.photos/800/500?random=126', 0, 0, 'Akagera wins Best Safari Destination award.'],

        // Culture (cat 10)
        ['Intore Dance Troupe Performs at UNESCO Headquarters in Paris', 'Rwanda\'s renowned Intore Dance Troupe performed at UNESCO headquarters in Paris as part of World Heritage Day celebrations. The performance, which included traditional warrior dances and contemporary interpretations, received a standing ovation from diplomats and cultural figures from around the world.', 10, 'https://picsum.photos/800/500?random=127', 0, 0, 'Intore dancers captivate UNESCO audience in Paris.'],

        // Environment (cat 11)
        ['Rwanda Plants 50 Million Trees in National Reforestation Campaign', 'Rwanda has planted 50 million trees as part of its ambitious national reforestation campaign, increasing forest cover to 32% of the country\'s total land area. The campaign, which involves citizens, schools, and corporations, aims to reach 35% forest cover by 2030.', 11, 'https://picsum.photos/800/500?random=128', 0, 0, 'National reforestation campaign plants 50 million trees.'],

        // Education (cat 12)
        ['University of Rwanda Ranks Among Top 500 Globally', 'The University of Rwanda has entered the Times Higher Education World University Rankings top 500 for the first time, making it one of only five sub-Saharan African universities in the ranking. The achievement was attributed to increased research output and international academic partnerships.', 12, 'https://picsum.photos/800/500?random=129', 0, 0, 'University of Rwanda enters global top 500 ranking.'],
        ['Rwanda Launches Free Coding Bootcamps for Youth', 'The Ministry of Education has launched free coding bootcamps in all 30 districts, targeting 100,000 young Rwandans aged 15-25. The program teaches Python, JavaScript, and mobile app development over 12-week intensive courses, with top graduates guaranteed internships at local tech companies.', 12, 'https://picsum.photos/800/500?random=130', 0, 0, 'Free coding programs launched across all 30 districts.'],
    ];

    let articlesDone = 0;
    articles.forEach(a => {
        db.run(`INSERT INTO articles (title_en, content_en, category_id, image_url, is_featured, is_breaking, status, summary_en, published_at, author_id, views) 
            VALUES (?, ?, ?, ?, ?, ?, 'published', ?, datetime('now', '-' || abs(random() % 72) || ' hours'), 1, abs(random() % 5000) + 100)`,
            [a[0], a[1], a[2], a[3], a[4], a[5], a[6]], function (err) {
                if (err) console.error('Article error:', err.message);
                if (!err && a[5] === 1) {
                    db.run('INSERT INTO breaking_news (article_id, is_active, slide_order) VALUES (?, 1, ?)', [this.lastID, articlesDone]);
                }
                articlesDone++;
                if (articlesDone === articles.length) console.log(`✅ ${articles.length} articles seeded`);
            });
    });

    // ==================== ADVERTISEMENTS ====================
    console.log('Seeding Advertisements...');
    const ads = [
        ['header', 'MTN Rwanda', 'https://picsum.photos/728/90?random=201', 'https://mtn.co.rw', 1],
        ['sidebar-top', 'RwandAir', 'https://picsum.photos/300/250?random=202', 'https://rwandair.com', 2],
        ['sidebar-bottom', 'Bank of Kigali', 'https://picsum.photos/300/250?random=203', 'https://bk.rw', 3],
        ['inline-1', 'Kigali Convention Centre', 'https://picsum.photos/728/90?random=204', 'https://kcc.rw', 4],
        ['inline-2', 'Rwanda Tourism Board', 'https://picsum.photos/728/90?random=205', 'https://visitrwanda.com', 5],
        ['footer', 'Equity Bank Rwanda', 'https://picsum.photos/728/90?random=206', 'https://equitybank.co.rw', 6],
    ];
    ads.forEach(a => {
        db.run('INSERT INTO advertisements (location, title, image_url, link_url, display_order, is_active) VALUES (?,?,?,?,?,1)', a);
    });

    // ==================== AUCTIONS ====================
    console.log('Seeding Auctions...');
    const auctions = [
        ['Commercial Property in Kigali CBD', 'Prime commercial property located in the heart of Kigali business district. 500 sqm office space with parking.', 'RWF 250,000,000', 'Kigali, Nyarugenge', '2026-04-15'],
        ['Toyota Land Cruiser V8 2024', 'Well-maintained Toyota Land Cruiser V8, 2024 model, 15,000 km. Full service history.', 'RWF 65,000,000', 'Kigali, Kicukiro', '2026-04-10'],
        ['Agricultural Land in Musanze (5 Hectares)', 'Fertile agricultural land near Volcanoes National Park. Ideal for farming or eco-tourism development.', 'RWF 180,000,000', 'Musanze, Northern Province', '2026-04-20'],
        ['Restaurant Equipment - Complete Kitchen Setup', 'Full commercial kitchen equipment from closing restaurant. Includes ovens, refrigerators, and prep stations.', 'RWF 15,000,000', 'Kigali, Gasabo', '2026-04-05'],
        ['Residential House in Kibagabaga', '4-bedroom house with garden, modern finishes, 24hr security. Located in quiet Kibagabaga neighborhood.', 'RWF 120,000,000', 'Kigali, Gasabo', '2026-04-25'],
    ];
    auctions.forEach(a => {
        db.run('INSERT INTO auction_news (title, description, price, location, end_date, is_active) VALUES (?,?,?,?,?,1)', a);
    });

    // ==================== ANNOUNCEMENTS ====================
    console.log('Seeding Announcements...');
    const announcements = [
        ['Umuganda Day - March 30th', 'All citizens are reminded that the monthly Umuganda community service day will be held on March 30th. Please participate in your local area.', 'high'],
        ['Tax Filing Deadline Extended', 'RRA has extended the individual tax filing deadline to April 30, 2026. File online at rra.gov.rw.', 'normal'],
        ['New Bus Routes in Kigali', 'KBS announces 5 new bus routes connecting Kicukiro, Gasabo, and Nyarugenge districts starting April 1st.', 'normal'],
        ['National Exam Results Available', 'Primary and secondary national examination results are now available online at mineduc.gov.rw.', 'high'],
        ['Water Supply Maintenance Notice', 'WASAC will conduct maintenance in Kimironko sector on March 25-26. Water supply may be interrupted.', 'normal'],
    ];
    announcements.forEach(a => {
        db.run('INSERT INTO announcements (title, content_en, priority, is_active) VALUES (?,?,?,1)', a);
    });

    // ==================== TODAY IN HISTORY ====================
    console.log('Seeding Today in History...');
    const history = [
        [2024, 'The African Union celebrated its 22nd anniversary, reflecting on progress in continental integration and peacekeeping.'],
        [2020, 'Rwanda implemented nationwide lockdown measures in response to COVID-19 pandemic, becoming one of the first African nations to act decisively.'],
        [2019, 'Kigali Arena (now BK Arena) was inaugurated, becoming the largest indoor sports facility in East Africa.'],
        [2017, 'Rwanda became the first low-income country to provide universal eye care, partnering with the Fred Hollows Foundation.'],
        [2015, 'Rwanda launched "Made in Rwanda" policy to boost local manufacturing and reduce trade deficit.'],
        [2010, 'The East African Community Common Market Protocol came into effect, enabling free movement of goods and labor.'],
        [2003, 'Rwanda adopted a new constitution by referendum, establishing a multi-party system and presidential term limits.'],
        [2000, 'Rwanda Vision 2020 development strategy was launched, setting ambitious goals for economic transformation.'],
        [1994, 'The 100-day genocide against the Tutsi began on April 7th, claiming over one million lives.'],
        [1962, 'Rwanda gained independence from Belgium on July 1st, with Grégoire Kayibanda as first President.'],
    ];
    history.forEach(h => {
        db.run('INSERT INTO today_history (year, event_en, is_active) VALUES (?,?,1)', h);
    });

    // ==================== REAL-TIME UPDATES ====================
    console.log('Seeding Real-Time Updates...');
    const updates = [
        ['⚽ APR FC leads Rwanda Premier League after matchday 22', 1],
        ['📊 Rwanda\'s inflation rate drops to 3.2% in March 2026', 2],
        ['✈️ RwandAir announces new direct flights to Mumbai and São Paulo', 3],
        ['🏗️ Bugesera Airport reaches 80% completion milestone', 4],
        ['🌍 President Kagame to attend AU Summit in Addis Ababa next week', 5],
        ['💰 RWF strengthens against USD, trading at 1,285 per dollar', 6],
        ['🎭 Miss Rwanda 2026 finals this Saturday at BK Arena', 7],
        ['🌧️ Meteo Rwanda: Heavy rains expected in Northern and Western provinces', 8],
    ];
    updates.forEach(u => {
        db.run('INSERT INTO real_time_updates (content_en, priority, is_active) VALUES (?,?,1)', u);
    });

    console.log('========================================');
    console.log('✅ Full content seeding complete!');
    console.log('========================================');

}, 1000);
