import User from "../Models/User";

const fullNames = [
    "Акматова Жаркынай",
    "Бессонов Константин",
    "Бакина Надежда",
    "Братова Фозия",
    "Винокуров Руслан",
    "Гавриленко Светлана",
    "Завьялова Екатерина",
    "Зарубина Ксения",
    "Ковалева Виктория",
    "Крылов Андрей",
    "Крылова Ирина",
    "Киселев Андрей",
    "Кузьмина Александра",
    "Кангина Анастасия",        
    "Крюкова Евдокия",
    "Крофт Анна",
    "Лебедкова Елена",
    "Малашина Юлия",
    "Польников Юрий",   
    "Рассомагин Александр",
    "Стахов Роман",
    "Трофимова Елена",
    "Федосеева Мария",
    "Федоренко Александра",
    "Шевченко Елена",
]


const addInvitedUserForAdmin = async () => {
    try {
        const candidates = await User.find({
            fullName: { $in: fullNames },
        });
        const invitedUser = await User.findById("6987850d8ff8acdd02650bb8");

        for (const candidate of candidates) {
            await User.findByIdAndUpdate(candidate._id, {
                invitedUser: invitedUser._id,
            });
        }
        console.log("addInvitedUserForAdmin success");
        return true;
    } catch (error) {
        console.error('Ошибка в addInvitedUserForAdmin:', error);
        return false;
    }
}

addInvitedUserForAdmin();