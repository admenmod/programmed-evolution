/*
[alpha-v1.0.2]

Программирование генома клеток
Все новые клетки получают новый геном
Старые клетки остаются без изменений

console.log для дебага
*/

while(true) {
	if(energy < 15) {
		yield* idle(2);
		continue;
	}

	yield* lookAround();

	if(around.forward) yield* turnRight(2);

	yield* moveForward();

	if(energy > 15 && isBudoff) yield* budoff();
}
