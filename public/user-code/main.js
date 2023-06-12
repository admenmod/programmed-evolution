while(true) {
	if(energy < 2) yield* idle(2);

	if(isBudoff) yield* budoff();

	yield* lookAround();

	if(around.forward) yield* turnRight(2);

	yield* moveForward();
}
