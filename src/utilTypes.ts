/* Returns a type with only the attributes (without the methods),
 * and all attributes made optional.
 * This is so that the constructor can be implemented as simply `Object.assign(this, data)`.
 */
export type ConstructorData<T> = {[A in keyof T as (T[A] extends Function ? never : A)]+?: T[A]};
