from repositories.user_repository import UserRepository


class UserService:
    def __init__(self, db=None):
        self.repo = UserRepository(db)

    def get_profile(self, user_id: int):
        user = self.repo.find_by_id(user_id)
        if not user:
            raise ValueError("Usuário não encontrado")
        return user

    def update_profile(self, user_id: int, full_name=None, country=None, avatar_url=None):
        user = self.repo.find_by_id(user_id)
        if not user:
            raise ValueError("Usuário não encontrado")

        updates = {}
        if full_name is not None:
            updates["full_name"] = full_name
        if country is not None:
            updates["country"] = country
        if avatar_url is not None:
            updates["avatar_url"] = avatar_url

        return self.repo.update(user, **updates)

    def close(self):
        self.repo.close()
