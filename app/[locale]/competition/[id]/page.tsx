"use client";
import { useParams } from "next/navigation";
import Image from "next/image";

// Mock Camp Data
const camps = [
  {
    id: "1",
    name: "CEDT INNOVATION SUMMIT 2025 HACKATHON",
    description: "วิศวกรรมคอมพิวเตอร์และเทคโนโลยีดิจิทัล จุฬาลงกรณ์มหาวิทยาลัย",
    imageUrl: "/camp/cedt.jpg",
    price: 0,
  },
  {
    id: "2",
    name: "FE Camp 18th ค่ายติวความถนัดทางวิศวกรรมศาสตร์ ครั้งที่ 18",
    description: "ชมรม FECamp คณะวิศวกรรมศาสตร์ จุฬาลงกรณ์มหาวิทยาลัย",
    imageUrl: "/camp/fe.jpg",
    price: 800,
  },
  {
    id: "3",
    name: "CBS Open House 2025 Empire of Wisdom and Wonder",
    description: "องค์การบริหารสโมสรนิสิตจุฬาลงกรณ์มหาวิทยาลัย",
    imageUrl: "/camp/cbs.jpg",
    price: 0,
  },
];

// Mock Comments
const comments = [
  {
    id: 1,
    user: "Nueng",
    avatar: "/avatars/nueng.png",
    text: "ในงานนี้ เราจะเริ่มจากการทำ proposal และส่ง prototype ที่สามารถใช้งานได้จริงหรือพัฒนาต่อยอดได้ หากผ่านเข้ารอบ จะมี workshop แนะนำเกี่ยวกับนวัตกรรมของเรา ซึ่งจัดที่จุฬาฯ หลังจากนั้นเราต้องพัฒนาผลงานต่อเพื่อส่งในรอบ semi-final และหากผ่านเข้ารอบอีกครั้ง จะมี workshop สำหรับผู้เข้ารอบ semi-final สุดท้ายจึงเป็นการคัดเลือกผู้เข้ารอบ finalist",
  },
  {
    id: 2,
    user: "Teterw",
    avatar: "/avatars/tete.png",
    text: "การทำ prototype งานนี้สำคัญมากครับ เพราะจะเป็นตัวชี้วัดว่าเรามีไอเดียที่น่าสนใจและสามารถพัฒนาต่อยอดได้จริงหรือไม่ นอกจากนี้ การเข้าร่วม workshop ยังช่วยให้เราได้รับความรู้และคำแนะนำจากผู้เชี่ยวชาญ ซึ่งจะเป็นประโยชน์อย่างมากในการพัฒนาผลงานของเราให้ดียิ่งขึ้น",
  },
];

export default function CompetitionPage() {
  const { id } = useParams(); // get param
  const camp = camps.find((c) => c.id === String(id)); // compare safely

  if (!camp) {
    return <div className="p-8 text-center">Competition not found</div>;
  }

  return (
    
      <div className="container mx-auto px-4 py-8">
      {/* Competition Info */}
      <div className="bg-white shadow-md rounded-xl p-4 mb-6">
        <Image
          src={camp.imageUrl}
          alt={camp.name}
          width={600}
          height={400}
          className="rounded-lg mb-4"
        />
        <h1 className="text-2xl font-bold mb-2 text-pink-700">{camp.name}</h1>
        <p className="text-gray-600 mb-2">{camp.description}</p>
        <p className="text-pink-600 font-bold">
          {camp.price === 0 ? "FREE" : "฿" + camp.price}
        </p>
      </div>

      <div className="bg-white shadow-md rounded-xl p-4">
        <h2 className="text-xl font-semibold mb-4 text-pink-600">
          ความคิดเห็นเกี่ยวกับกิจกรรม
        </h2>
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="flex items-start gap-3 border-b border-gray-200 pb-3 mb-3"
          >
            {/* Fixed square wrapper */}
            <div className="w-12 h-12 flex-shrink-0 rounded-full overflow-hidden">
              <Image
                src={comment.avatar}
                alt={comment.user}
                width={48}   // same as container
                height={48}  // same as container
                className="object-cover w-full h-full"
              />
            </div>
            <div>
              <p className="font-semibold">{comment.user}</p>
              <p className="text-gray-700">{comment.text}</p>
            </div>
          </div>
        ))}
      </div>

      </div>
    
  );
}
