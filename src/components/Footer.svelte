<script>

</script>

<footer>
    <div>
        <h1>About</h1>

        <p>Created by Ajay Rajamani for the Mintbean Svelte.js hackathon</p>

        <ul>
            <li><a target="_blank" href="https://github.com/stickmanbob/svelteQuizGame">Code</a></li>
            <li><a target="_blank" href="https://ajay-rajamani.me">About Me</a> </li>
        </ul>

        <span class="copyright">
            <i class="fas fa-copyright"></i> 2020 Ajay Rajamani
        </span>
    </div>
</footer>

<style>

    footer{
        background-image: url("../assets/header_background.jpg");
        position: absolute;
        bottom: 0px;
        margin: 0px auto;
        margin-top: 20px;
        width: 100%;
        /* display: flex;

        flex-direction: column;
        align-items: center; */
    }

    div{
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    p{
        font-size: 12px;
        text-align: center;
        display: inline-block;
    }

    ul{
        display: flex;
        justify-content: center;
        align-items: center;
        margin: 10px 0px; 
    }

    li{
        font-size: 14px;
        margin: 0px 10px;
    }

    h1{
        font-size: 20px;
        margin-bottom: 10px;
        margin-top: 5px;
    }

    span.copyright{
        font-size: 8px;
        color: gray; 
    }

</style>