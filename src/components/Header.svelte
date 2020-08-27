<header>
    <h1>Name that Fish!</h1>
</header>

<style>
    header{
        display: flex;
        justify-content: center;
        margin-top: 10px;

        /* border: 4px solid black; */
        background-color: white;
        padding:8px 0px;
        border-radius: 6px;

        width: 600px;
    }

    h1{
        font-size: 48px;
        font-weight: 600;
        color:black;
    }

    @media (max-width: 450px){
        header{
            margin-top: 0px;
            width: 100%;
        }

        h1{
            font-size: 30px;
        }
    }
</style>