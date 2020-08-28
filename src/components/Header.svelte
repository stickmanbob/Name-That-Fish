<header>
    <h1>Name that Fish!</h1>
</header>

<style>
    header{
        display: flex;
        justify-content: center;
        margin-top: 0px;

        /* border: 4px solid black; */
        background-color: white;
        background-image: url("../assets/header_background.jpg");
        box-shadow: 0px 2px 10px;
        padding:8px 0px;
        /* border-radius: 6px; */

        width: 100%;
    }

    h1{
        margin-top: 5px;
        font-size: 48px;
        font-weight: 600;
        /* color: whitesmoke; */
        color: whitesmoke;
        -webkit-text-stroke-width: 1px;
        -webkit-text-stroke-color: black;

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