import type { Flashcard, Topic } from './types'

export const OOP_TOPICS: Topic[] = [
  { id: 1, title: 'Tổng quan OOP' },
  { id: 2, title: 'Class & Object' },
  { id: 3, title: 'Encapsulation' },
  { id: 4, title: 'Inheritance' },
  { id: 5, title: 'Polymorphism' },
  { id: 6, title: 'Abstraction' },
  { id: 7, title: 'SOLID & Patterns' },
]

export const OOP_FLASHCARDS: Flashcard[] = [
  {
    id: '1.1',
    topicId: 1,
    difficulty: 'Cơ bản',
    question: 'OOP (Object-Oriented Programming) là gì?',
    answerTitle: 'Lập trình hướng đối tượng (OOP)',
    answerPoints: [
      'Là phương pháp lập trình dựa trên khái niệm "đối tượng" (objects) thay vì "hàm" (functions).',
      'Dữ liệu (attributes) và hành vi (methods) được gom nhóm lại trong một đối tượng.',
      'Giúp mô phỏng thế giới thực vào trong code một cách tự nhiên.',
    ],
    codeExample: `public class Main {
    public static void main(String[] args) {
        User u = new User("Alice");
        u.greet();
    }
}
class User {
    private String name;
    public User(String name) { this.name = name; }
    public void greet() { System.out.println("Hi, I am " + name); }
}`,
  },
  {
    id: '1.2',
    topicId: 1,
    difficulty: 'Cơ bản',
    question: '4 trụ cột cốt lõi của OOP là gì?',
    answerTitle: '4 Trụ cột OOP',
    answerPoints: [
      'Encapsulation (Đóng gói): Bảo vệ dữ liệu nội bộ.',
      'Inheritance (Kế thừa): Tái sử dụng code.',
      'Polymorphism (Đa hình): Một hành vi, nhiều hình thái.',
      'Abstraction (Trừu tượng): Ẩn chi tiết phức tạp, hiện ra interface đơn giản.',
    ],
  },
  {
    id: '1.3',
    topicId: 1,
    difficulty: 'Trung bình',
    question: 'Coupling và Cohesion trong OOP là gì? Cái nào tốt hơn?',
    answerTitle: 'Độ kết nối & Độ tập trung',
    answerPoints: [
      'Cohesion (Độ gắn kết): Các method trong 1 class phải liên quan chặt chẽ đến mục tiêu của class đó -> Cần CAO.',
      'Coupling (Độ phụ thuộc): Sự phụ thuộc giữa các class với nhau -> Cần THẤP.',
      'Lý tưởng: High Cohesion - Low Coupling.',
    ],
  },
  {
    id: '2.1',
    topicId: 2,
    difficulty: 'Cơ bản',
    question: 'Class và Object khác nhau thế nào?',
    answerTitle: 'Blueprint vs Instance',
    answerPoints: [
      'Class: Là bản thiết kế, khuôn mẫu (ví dụ: Bản vẽ kỹ thuật xe hơi).',
      'Object: Là thực thể cụ thể được tạo ra từ bản thiết kế đó (ví dụ: Chiếc xe màu đỏ cụ thể).',
      'Class nằm trong file code, Object nằm trong bộ RAM khi app chạy.',
    ],
  },
  {
    id: '2.2',
    topicId: 2,
    difficulty: 'Trung bình',
    question: 'Instance variable vs Class variable (Static)?',
    answerTitle: 'Biến Instance vs Biến Tĩnh',
    answerPoints: [
      'Instance Variable: Mỗi đối tượng có một bản sao riêng (ví dụ: name, age).',
      'Class Variable (Static): Tất cả đối tượng dùng chung 1 giá trị duy nhất (ví dụ: count_users).',
      'Biến static được gọi trực tiếp qua tên Class mà không cần tạo "new".',
    ],
    codeExample: `class Counter {
    static int count = 0; // Class variable
    String name;          // Instance variable
    Counter(String name) {
        this.name = name;
        count++;
    }
}`,
  },
  {
    id: '3.1',
    topicId: 3,
    difficulty: 'Cơ bản',
    question: 'Tính Đóng gói (Encapsulation) là gì?',
    answerTitle: 'Bảo vệ trạng thái đối tượng',
    answerPoints: [
      'Là việc gom nhóm dữ liệu và phương thức vào trong một class.',
      'Che giấu thông tin nhạy cảm bên trong (Data Hiding).',
      'Cung cấp các phương thức công khai để truy cập an toàn (Interface).',
    ],
  },
  {
    id: '3.2',
    topicId: 3,
    difficulty: 'Trung bình',
    question: 'Sự khác biệt giữa public, private và protected?',
    answerTitle: 'Access Modifiers',
    answerPoints: [
      'public: Truy cập từ bất cứ đâu.',
      'private: Chỉ truy cập được bên trong chính Class đó.',
      'protected: Truy cập được bên trong Class đó và các Class con kế thừa từ nó.',
    ],
    codeExample: `class Parent {
    public int a = 1;
    private int b = 2;
    protected int c = 3;
}
class Child extends Parent {
    void test() {
        System.out.println(a); // OK
        // System.out.println(b); // ERROR
        System.out.println(c); // OK
    }
}`,
  },
  {
    id: '3.3',
    topicId: 3,
    difficulty: 'Trung bình',
    question: 'Tại sao nên dùng Getter và Setter thay vì truy cập biến trực tiếp?',
    answerTitle: 'Kiểm soát truy cập',
    answerPoints: [
      'Validation: Kiểm tra dữ liệu trước khi gán (ví dụ: tuổi phải > 0).',
      'Read-only: Chỉ cung cấp Getter, không có Setter.',
      'Tính linh hoạt: Có thể thay đổi logic xử lý bên trong mà không ảnh hưởng code bên ngoài.',
    ],
    codeExample: `class Account {
    private double balance = 0;
    public double getBalance() { return balance; }
    public void setBalance(double value) {
        if (value < 0) throw new IllegalArgumentException("Không được âm!");
        this.balance = value;
    }
}`,
  },
  {
    id: '4.1',
    topicId: 4,
    difficulty: 'Cơ bản',
    question: 'Kế thừa "IS-A" relationship là gì?',
    answerTitle: 'Mối quan hệ Kế thừa',
    answerPoints: [
      'Là quan hệ mà một Class con thừa hưởng thuộc tính và phương thức của Class cha.',
      'Ví dụ: Dog IS-A Animal. Student IS-A Person.',
      'Sử dụng từ khóa "extends" trong TS/JS/Java.',
    ],
  },
  {
    id: '4.2',
    topicId: 4,
    difficulty: 'Trung bình',
    question: 'Method Overriding là gì?',
    answerTitle: 'Ghi đè phương thức',
    answerPoints: [
      'Xảy ra khi Class con định nghĩa lại một method đã có ở Class cha.',
      'Method ở con phải có cùng tên, cùng tham số với ở cha.',
      'Dùng để thực hiện hành vi cụ thể hơn cho lớp con.',
    ],
    codeExample: `class Animal {
    void makeSound() { System.out.println("Some sound"); }
}
class Cat extends Animal {
    @Override
    void makeSound() { System.out.println("Meow"); }
}`,
  },
  {
    id: '4.3',
    topicId: 4,
    difficulty: 'Nâng cao',
    question: 'Tại sao Composition (HAS-A) thường được ưu tiên hơn Inheritance (IS-A)?',
    answerTitle: 'Composition over Inheritance',
    answerPoints: [
      'Kế thừa tạo ra mối liên kết quá chặt chẽ (Tightly Coupled). Cha thay đổi, con bị ảnh hưởng.',
      'Composition (Chứa 1 object khác bên trong) linh hoạt hơn, dễ thay đổi hành vi lúc runtime.',
      'Nhiều ngôn ngữ không hỗ trợ Đa kế thừa (Multiple Inheritance) nên Composition là giải pháp thay thế.',
    ],
  },
  {
    id: '5.1',
    topicId: 5,
    difficulty: 'Cơ bản',
    question: 'Đa hình (Polymorphism) là gì?',
    answerTitle: 'Một Interface - Nhiều Implementation',
    answerPoints: [
      'Cho phép một đối tượng được coi như là instance của lớp cha nhưng thực thi hành vi của lớp con.',
      'Nhiều lớp khác nhau có thể phản hồi cùng một lời gọi phương thức theo những cách riêng.',
      'Ví dụ: Một mảng [Dog, Cat] gọi ".makeSound()" sẽ ra tiếng khác nhau.',
    ],
  },
  {
    id: '5.2',
    topicId: 5,
    difficulty: 'Trung bình',
    question: 'Static Polymorphism vs Dynamic Polymorphism?',
    answerTitle: 'Đa hình Tĩnh vs Đa hình Động',
    answerPoints: [
      'Static (Compile-time): Method Overloading (Cùng tên nhưng khác tham số).',
      'Dynamic (Runtime): Method Overriding (Ghi đè phương thức lớp cha).',
      'Dynamic Polymorphism giúp hệ thống quyết định phương thức nào được gọi lúc chương trình đang chạy.',
    ],
  },
  {
    id: '5.3',
    topicId: 5,
    difficulty: 'Nâng cao',
    question: 'Upcasting và Downcasting là gì?',
    answerTitle: 'Ép kiểu đối tượng',
    answerPoints: [
      'Upcasting: Chuyển kiểu từ Con lên Cha (Luôn an toàn, ví dụ: Dog -> Animal).',
      'Downcasting: Chuyển kiểu từ Cha xuống Con (Không an toàn, cần kiểm tra kiểu trước khi ép).',
      'Dùng để truy cập các phương thức đặc thù của lớp con sau khi đã dùng đa hình.',
    ],
    codeExample: `Animal a = new Dog(); // Upcasting
if (a instanceof Dog) {
    Dog d = (Dog) a; // Downcasting
    d.bark();
}`,
  },
  {
    id: '6.1',
    topicId: 6,
    difficulty: 'Trung bình',
    question: 'Abstract Class vs Interface khác nhau chính ở điểm nào?',
    answerTitle: 'Lớp trừu tượng vs Giao diện',
    answerPoints: [
      'Abstract Class: Có thể chứa cả method có code (concrete) và method không code. Thể hiện bản chất đối tượng (Là gì).',
      'Interface: Thể hiện chức năng (Làm được gì). Trong Java, Interface mặc định mọi method là public abstract.',
    ],
    codeExample: `abstract class Shape { // Abstract Class
    abstract double getArea();
    void print() { System.out.println("Printing..."); }
}
interface Drawable { // Interface
    void draw();
}`,
  },
  {
    id: '6.2',
    topicId: 6,
    difficulty: 'Cơ bản',
    question: 'Có thể khởi tạo đối tượng từ Abstract Class không?',
    answerTitle: 'Tính chất Abstract Class',
    answerPoints: [
      'KHÔNG. Không thể dùng "new AbstractClass()".',
      'Lý do: Lớp trừu tượng chưa được định nghĩa hoàn chỉnh (có thể chứa abstract method rỗng).',
      'Chỉ dùng làm khung để các lớp con kế thừa và hoàn thiện.',
    ],
  },
  {
    id: '7.1',
    topicId: 7,
    difficulty: 'Nâng cao',
    question: 'Chữ S trong SOLID là gì?',
    answerTitle: 'Single Responsibility Principle (SRP)',
    answerPoints: [
      'Mỗi Class chỉ nên đảm nhận một trách nhiệm duy nhất.',
      'Một Class chỉ nên có duy nhất một lý do để thay đổi.',
      'Giúp code dễ đọc, dễ test và giảm thiểu ảnh hưởng dây chuyền khi sửa code.',
    ],
  },
  {
    id: '7.2',
    topicId: 7,
    difficulty: 'Nâng cao',
    question: 'Chữ O trong SOLID (Open/Closed Principle) nói gì?',
    answerTitle: 'Nguyên tắc Đóng/Mở',
    answerPoints: [
      'Phần mềm nên "Mở" để mở rộng thêm tính năng mới, nhưng "Đóng" với việc sửa đổi code hiện tại.',
      'Thay vì vào sửa if/else cũ, hãy tạo class mới kế thừa hoặc implement interface cũ.',
      'Dùng tối đa Abstraction để thực hiện nguyên tắc này.',
    ],
  },
  {
    id: '7.3',
    topicId: 7,
    difficulty: 'Nâng cao',
    question: 'Dependency Inversion (D trong SOLID) là gì?',
    answerTitle: 'Đảo ngược phụ thuộc',
    answerPoints: [
      'Các module cấp cao không nên phụ thuộc vào module cấp thấp. Cả hai nên phụ thuộc vào Abstraction (Interface).',
      'Giúp tách rời (Decouple) các thành phần, dễ dàng thay thế database, logger... mà không sửa code logic chính.',
    ],
    codeExample: `// Thay vì: Store -> MySQL
// Nên: Store -> IDatabase <- MySQL (Java Interface)`,
  },
  {
    id: '7.4',
    topicId: 7,
    difficulty: 'Trung bình',
    question: 'Association vs Aggregation vs Composition?',
    answerTitle: 'Các loại liên kết đối tượng',
    answerPoints: [
      'Association: Mối quan hệ chung chung giữa 2 đối tượng độc lập.',
      'Aggregation (Quan hệ yếu): Đối tượng chứa có thể tồn tại độc lập với đối tượng bị chứa (Ví dụ: Player vs Team).',
      'Composition (Quan hệ mạnh): Đối tượng bị chứa KHÔNG THỂ tồn tại nếu đối tượng chứa bị xóa (Ví dụ: Room vs House).',
    ],
  },
  {
    id: '7.5',
    topicId: 7,
    difficulty: 'Nâng cao',
    question: 'Design Pattern "Singleton" dùng để làm gì?',
    answerTitle: 'Mẫu Khởi tạo Độc bản',
    answerPoints: [
      'Đảm bảo một Class chỉ có duy nhất một Instance (đối tượng) trong suốt vòng đời ứng dụng.',
      'Cung cấp một điểm truy cập toàn cục cho instance đó.',
      'Thường dùng cho: Database Connection, Configuration Manager, Logger.',
    ],
    codeExample: `class Database {
    private static Database instance;
    private Database() {} // Block 'new'
    public static Database getInstance() {
        if (instance == null) instance = new Database();
        return instance;
    }
}`,
  },
  {
    id: '7.6',
    topicId: 7,
    difficulty: 'Trung bình',
    question: 'Factory Method Pattern giải quyết vấn đề gì?',
    answerTitle: 'Mẫu Khởi tạo Factory Method',
    answerPoints: [
      'Ủy quyền việc khởi tạo object cụ thể cho subclass thay vì gọi "new" cứng ở khắp nơi.',
      'Tách biệt code sử dụng đối tượng (Client) khỏi class cụ thể (ConcreteProduct).',
      'Dễ dàng bổ sung loại sản phẩm mới theo nguyên lý Open/Closed.',
    ],
    codeExample: `interface Transport { void deliver(); }
abstract class Logistics {
    abstract Transport createTransport();
    public void planDelivery() { createTransport().deliver(); }
}`,
  },
  {
    id: '7.7',
    topicId: 7,
    difficulty: 'Trung bình',
    question: 'Strategy Pattern khác gì so với việc dùng nhiều if/else?',
    answerTitle: 'Mẫu Chiến lược (Strategy)',
    answerPoints: [
      'Đóng gói từng thuật toán thành một class riêng biệt có chung Interface.',
      'Cho phép hoán đổi thuật toán lúc Runtime (VD: đổi phương thức thanh toán MoMo / VNPay / Card).',
      'Loại bỏ khối if/else hoặc switch/case phình to khó bảo trì.',
    ],
    codeExample: `interface PayStrategy { void pay(int amount); }
class Checkout {
    private PayStrategy strategy;
    public void setStrategy(PayStrategy s) { this.strategy = s; }
    public void process(int money) { strategy.pay(money); }
}`,
  },
  {
    id: '7.8',
    topicId: 7,
    difficulty: 'Nâng cao',
    question: 'Observer Pattern hoạt động ra sao trong thực tế?',
    answerTitle: 'Mẫu Quan sát (Pub/Sub)',
    answerPoints: [
      'Định nghĩa quan hệ Một-Nhiều (Subject -> danh sách Observers).',
      'Khi trạng thái của Subject thay đổi, tất cả Observer đã đăng ký tự động nhận thông báo cập nhật.',
      'Là nền tảng cho Event Listener, RxJS, Vue Reactivity và Webhook.',
    ],
    codeExample: `interface Listener { void update(String event); }
class EventBus {
    private List<Listener> subs = new ArrayList<>();
    public void emit(String ev) {
        subs.forEach(s -> s.update(ev));
    }
}`,
  },
  {
    id: '7.9',
    topicId: 7,
    difficulty: 'Nâng cao',
    question: 'Decorator Pattern dùng khi nào thay cho Kế thừa?',
    answerTitle: 'Mẫu Trang trí (Wrapper)',
    answerPoints: [
      'Gắn thêm hành vi mới cho một object tại runtime bằng cách bọc (wrap) nó qua các lớp vỏ cùng interface.',
      'Tránh bùng nổ số lượng subclass khi kết hợp nhiều tùy chọn (VD: Cà phê + Sữa + Trân châu).',
      'Java I/O (BufferedReader(new FileReader(...))) là ví dụ kinh điển.',
    ],
    codeExample: `interface Coffee { int cost(); }
class MilkDecorator implements Coffee {
    private Coffee base;
    public MilkDecorator(Coffee base) { this.base = base; }
    public int cost() { return base.cost() + 5; }
}`,
  },
  {
    id: '7.10',
    topicId: 7,
    difficulty: 'Cơ bản',
    question: 'Builder Pattern hữu ích thế nào với object nhiều tham số?',
    answerTitle: 'Mẫu Xây dựng Từng bước (Builder)',
    answerPoints: [
      'Tách quá trình khởi tạo đối tượng phức tạp ra khỏi biểu diễn cuối cùng của nó.',
      'Giải quyết vấn đề Constructor có quá nhiều tham số tùy chọn dễ nhầm thứ tự.',
      'Hỗ trợ Fluent API nối chuỗi gọn gàng và tạo object Immutable.',
    ],
    codeExample: `User u = new UserBuilder("Anh")
    .role("Frontend")
    .active(true)
    .build();`,
  },
  {
    id: '7.11',
    topicId: 7,
    difficulty: 'Nâng cao',
    question: 'Liskov Substitution Principle (L trong SOLID) đòi hỏi gì?',
    answerTitle: 'Nguyên lý Thay thế Liskov',
    answerPoints: [
      'Đối tượng của class con phải có thể thay thế hoàn toàn class cha mà không làm sai lệch hành vi chương trình.',
      'Class con không được thắt chặt điều kiện đầu vào hoặc ném thêm Exception bất ngờ ngoài hợp đồng class cha.',
      'Ví dụ kinh điển: Chim cánh cụt không nên kế thừa Bird có hàm fly() nếu không bay được.',
    ],
  },
  {
    id: '7.12',
    topicId: 7,
    difficulty: 'Trung bình',
    question: 'Adapter Pattern giải quyết vấn đề gì trong hệ thống OOP?',
    answerTitle: 'Adapter Pattern (Bộ chuyển đổi)',
    answerPoints: [
      'Chuyển đổi interface của một class có sẵn (hoặc SDK bên thứ 3) sang interface mà code hiện tại kỳ vọng.',
      'Giúp hai thành phần không tương thích giao tiếp mượt mà mà không cần sửa mã nguồn cũ.',
      'Ví dụ thực tế: Bọc cổng thanh toán đối tác vào interface PaymentGateway thống nhất của app.',
    ],
  },
  {
    id: '7.13',
    topicId: 7,
    difficulty: 'Cơ bản',
    question: 'Facade Pattern khác gì với Adapter Pattern?',
    answerTitle: 'Facade Pattern (Mặt tiền đơn giản hóa)',
    answerPoints: [
      'Facade tạo một API đơn giản, gọn nhẹ đứng trước cả một hệ thống con phức tạp nhiều bước.',
      'Adapter giúp làm khớp hai interface vốn không tương thích; Facade giúp giảm độ phức tạp khi gọi.',
      'Ví dụ: OrderService.placeOrder() gói gọn kiểm kho, thanh toán, gửi mail trong một lời gọi.',
    ],
  },
  {
    id: '7.14',
    topicId: 7,
    difficulty: 'Nâng cao',
    question: 'Làm sao cài đặt Singleton an toàn đa luồng (Thread-Safe)?',
    answerTitle: 'Thread-Safe Singleton (Initialization-on-demand / Double-Checked)',
    answerPoints: [
      'Trong môi trường đa luồng, if (instance == null) dễ tạo 2 object nếu 2 thread chạy song song.',
      'Dùng synchronized (double-checked locking với volatile) hoặc static inner holder class / enum để đảm bảo khởi tạo đúng 1 lần.',
      'Hoặc trong DI container (Spring/NestJS), quản lý vòng đời singleton ở tầng container thay vì tự viết static.',
    ],
  },
  {
    id: '7.15',
    topicId: 7,
    difficulty: 'Trung bình',
    question: 'Immutability (Tính bất biến) mang lại lợi ích gì cho thiết kế OOP?',
    answerTitle: 'Immutable Object & Defensive Copy',
    answerPoints: [
      'Object bất biến không thể thay đổi trạng thái sau khi khởi tạo (các field đều private final, không có setter).',
      'An toàn tuyệt đối khi chia sẻ giữa nhiều luồng (Thread-safe), dễ dự đoán state và tránh lỗi side-effect.',
      'Nếu field chứa List/Date có thể thay đổi, cần trả về bản sao bảo vệ (defensive copy).',
    ],
  },
  {
    id: '7.16',
    topicId: 7,
    difficulty: 'Nâng cao',
    question: 'Dependency Injection (DI) khác gì với Service Locator?',
    answerTitle: 'Dependency Injection vs Service Locator',
    answerPoints: [
      'Với DI, class khai báo rõ các phụ thuộc qua Constructor/Props và được bên ngoài truyền vào (tường minh).',
      'Với Service Locator, class tự đi tìm phụ thuộc từ một registry toàn cục khiến phụ thuộc bị ẩn giấu.',
      'DI giúp unit test bằng Mock dễ dàng hơn và phát hiện thiếu dependency ngay lúc khởi tạo.',
    ],
  },
]
