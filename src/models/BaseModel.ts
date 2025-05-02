import { EntityManager } from "@mikro-orm/mongodb";

export abstract class BaseEntity {
	static em: EntityManager;

	static useEntityManager(em: EntityManager) {
		this.em = em;
	}

	async save(): Promise<this> {
		const ctor = this.constructor as typeof BaseEntity;
		ctor.em.persist(this);
		await ctor.em.flush();
		return this;
	}
	async remove(): Promise<void> {
		const ctor = this.constructor as typeof BaseEntity;
		await ctor.em.removeAndFlush(this);
	}
}
