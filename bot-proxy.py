import sys


sys.dont_write_bytecode = True


from smart_airdrop_claimer import base

from core.token import get_token

from core.info import get_balance

from core.task import process_check_in, process_do_task

from core.reward import process_hold_coin, process_spin, process_swipe_coin


import time

import json



class Major:

    def __init__(self):

        # Get file directory

        self.data_file = base.file_path(file_name="data-proxy.json")

        self.config_file = base.file_path(file_name="config.json")


        # Initialize line

        self.line = base.create_line(length=50)


        # Initialize banner

        self.banner = base.create_banner(game_name="Major")


        # Get config

        self.auto_check_in = base.get_config(

            config_file=self.config_file, config_name="auto-check-in"

        )


        self.auto_do_task = base.get_config(

            config_file=self.config_file, config_name="auto-do-task"

        )


        self.auto_play_hold_coin = base.get_config(

            config_file=self.config_file, config_name="auto-play-hold-coin"

        )


        self.auto_spin = base.get_config(

            config_file=self.config_file, config_name="auto-spin"

        )


        self.auto_play_swipe_coin = base.get_config(

            config_file=self.config_file, config_name="auto-play-swipe-coin"

        )


    def main(self):

        while True:

            base.clear_terminal()

            print(self.banner)

            accounts = json.load(open(self.data_file, "r"))["accounts"]

            num_acc = len(accounts)

            base.log(self.line)

            base.log(f"{base.green}Numer of accounts: {base.white}{num_acc}")

            total_current_balnce = 0

            total_new_balnce = 0

            for no, account in enumerate(accounts):

                base.log(self.line)

                base.log(f"{base.green}Account number: {base.white}{no+1}/{num_acc}")

                data = account["acc_info"]

                proxy_info = account["proxy_info"]

                parsed_proxy_info = base.parse_proxy_info(proxy_info)

                if parsed_proxy_info is None:

                    break


                actual_ip = base.check_ip(proxy_info=proxy_info)


                proxies = base.format_proxy(proxy_info=proxy_info)


                try:

                    token = get_token(data=data, proxies=proxies)


                    if token:


                        current_balance = get_balance(token=token, proxies=proxies)

                        total_current_balnce += current_balance


                        # Check in

                        if self.auto_check_in:

                            base.log(f"{base.yellow}Auto Check-in: {base.green}ON")

                            process_check_in(token=token, proxies=proxies)

                        else:

                            base.log(f"{base.yellow}Auto Check-in: {base.red}OFF")


                        # Do task

                        if self.auto_do_task:

                            base.log(f"{base.yellow}Auto Do Task: {base.green}ON")

                            process_do_task(token=token, proxies=proxies)

                        else:

                            base.log(f"{base.yellow}Auto Do Task: {base.red}OFF")


                        # Hold Coin

                        if self.auto_play_hold_coin:

                            base.log(

                                f"{base.yellow}Auto Play Hold Coin: {base.green}ON"

                            )

                            process_hold_coin(token=token, proxies=proxies)

                        else:

                            base.log(f"{base.yellow}Auto Play Hold Coin: {base.red}OFF")


                        # Spin

                        if self.auto_spin:

                            base.log(f"{base.yellow}Auto Spin: {base.green}ON")

                            process_spin(token=token, proxies=proxies)

                        else:

                            base.log(f"{base.yellow}Auto Spin: {base.red}OFF")


                        # Swipe Coin

                        if self.auto_play_swipe_coin:

                            base.log(

                                f"{base.yellow}Auto Play Swipe Coin: {base.green}ON"

                            )

                            process_swipe_coin(token=token, proxies=proxies)

                        else:

                            base.log(

                                f"{base.yellow}Auto Play Swipe Coin: {base.red}OFF"

                            )


                        new_balance = get_balance(token=token, proxies=proxies)

                        total_new_balnce += new_balance

                        base.log(f"Current total new Balances: {total_new_balnce}")


                        base.log(f"Total current Balances: {total_current_balnce}")

                        base.log(f"Total new Balances: {total_new_balnce}")


                    else:

                        base.log(f"{base.red}Token not found! Please get new query id")

                except Exception as e:

                    base.log(f"{base.red}Error: {base.white}{e}")


            print()

            base.log(f"Total current Balances: {total_current_balnce}")

            base.log(f"Total new Balances: {total_new_balnce}")

            wait_time = 60 * 60 * 8

            base.log(f"{base.yellow}Wait for {int(wait_time/60)} minutes!")

            time.sleep(wait_time)



if __name__ == "__main__":

    try:

        major = Major()

        major.main()

    except KeyboardInterrupt:

        sys.exit()