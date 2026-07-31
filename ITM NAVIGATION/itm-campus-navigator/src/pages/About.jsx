export default function About() {
  return (
    <div className="page">
      <div className="eyebrow">About</div>
      <h1 className="page-title">ITM University, Gwalior</h1>
      <p className="page-sub">
        The information provided below is compiled from publicly available sources, including the university website and other reliable references. While every effort has been made to ensure accuracy, users are advised to verify the latest and official information through the university's official website or Admission Office. This section should be updated with the university's official content whenever available..
      </p>

      <div className="glass-card" style={{ padding: '24px 22px', marginBottom: 18 }}>
        <div className="eyebrow">Overview</div>
        <p className="detail-desc">
          ITM University, Gwalior is a multidisciplinary state university established under an Act of the Madhya Pradesh State Legislature. Spread across 125+ acres near NH-75, the university offers a modern learning environment with world-class infrastructure. Guided by its motto, "Celebrating Dreams," ITM University is committed to nurturing innovation, academic excellence, research, and holistic student development..
        </p>
      </div>

      <div className="glass-card" style={{ padding: '24px 22px', marginBottom: 18 }}>
        <div className="eyebrow">Schools &amp; Programs</div>
        <p className="detail-desc">
          The university comprises 14 constituent schools offering a wide range of Undergraduate (UG), Postgraduate (PG), Diploma, and Ph.D. programs across diverse disciplines, including Engineering & Technology, Management, Sciences, Nursing, Education, Physical Education, Fashion & Design, Pharmacy, Law, Agriculture, and other professional fields, providing students with comprehensive academic and career opportunities.
        </p>
      </div>

      <div className="glass-card" style={{ padding: '24px 22px', marginBottom: 18 }}>
        <div className="eyebrow">Campus Facilities</div>
        <ul className="plain-list">
          <li>NAAD Amphitheatre — 3000+ seating capacity, cultural aur co-curricular events ke liye</li>
          <li>Auditorium, on-campus nursing home aur 24-hour OPD</li>
          <li>Gymnasium aur multiple indoor/outdoor sports facilities</li>
          <li>5 hostels —  (boys) aur Girls Cottage (girls)</li>
          <li>Dedicated mess halls aur dining facilities</li>
        </ul>
      </div>

      <div className="glass-card" style={{ padding: '24px 22px' }}>
        <div className="eyebrow">Contact</div>
        <p className="detail-desc">
          Website: <a href="https://www.itmuniversity.ac.in/" target="_blank" rel="noreferrer">www.itmuniversity.ac.in</a>
          <br />
          For admission assistance and the university's official address, please visit the Admission & Counseling Cell (Admin Block) or refer to the university's official website for the most up-to-date information..
        </p>
      </div>
    </div>
  )
}
