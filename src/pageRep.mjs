

export class ActivePage {
    constructor(){
        this.textChars = [];
        this.stateChanges = [];
    }
    applyDeltas(deltas){
        const {textChars,stateChanges} = this;
        let {ops} = deltas;

        let index = 0;
        let currentChar = '';
        let currentState = {};

        function walkForwardApply(){
            currentChar = textChars[index];
            Object.assign(currentState,stateChanges[index]);
            index += 1;
        }


        for (const operation of ops){
            let retainAmount = 0;
            if(operation.retain){
                retainAmount += parseInt(operation.retain) || 0;
            };

            //----


            if(operation.insert){
                let charArray = String(operation.insert).split('');
                textChars.splice(index,);
            } else if(false){

            }


            //----

        }

    }
    toDeltas(){

    }
}